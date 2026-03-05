import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner, Button, Card, Select, Toast, Typography } from '@douyinfe/semi-ui';
import { JSONEditor } from '@/components/ui/json-editor';
import { Carousel } from '@douyinfe/semi-ui';
import type { BaseCodingAgent, ExecutorConfig } from 'shared/types';
import { McpConfig } from 'shared/types';
import { useUserSystem } from '@/components/ConfigProvider';
import { mcpServersApi } from '@/lib/api';
import { McpConfigStrategyGeneral } from '@/lib/mcpStrategies';

export function McpSettings() {
  const { t } = useTranslation('settings');
  const { config, profiles } = useUserSystem();
  const [mcpServers, setMcpServers] = useState('{}');
  const [mcpConfig, setMcpConfig] = useState<McpConfig | null>(null);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [mcpLoading, setMcpLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<ExecutorConfig | null>(
    null
  );
  const [mcpApplying, setMcpApplying] = useState(false);
  const [mcpConfigPath, setMcpConfigPath] = useState<string>('');

  // Initialize selected profile when config loads
  useEffect(() => {
    if (config?.executor_profile && profiles && !selectedProfile) {
      // Find the current profile
      const currentProfile = profiles[config.executor_profile.executor];
      if (currentProfile) {
        setSelectedProfile(currentProfile);
      } else if (Object.keys(profiles).length > 0) {
        // Default to first profile if current profile not found
        setSelectedProfile(Object.values(profiles)[0]);
      }
    }
  }, [config?.executor_profile, profiles, selectedProfile]);

  // Load existing MCP configuration when selected profile changes
  useEffect(() => {
    const loadMcpServersForProfile = async (profile: ExecutorConfig) => {
      // Reset state when loading
      setMcpLoading(true);
      setMcpError(null);
      // Set default empty config based on agent type using strategy
      setMcpConfigPath('');

      try {
        // Load MCP servers for the selected profile/agent
        // Find the key for this profile
        const profileKey = profiles
          ? Object.keys(profiles).find((key) => profiles[key] === profile)
          : null;
        if (!profileKey) {
          throw new Error('Profile key not found');
        }

        const result = await mcpServersApi.load({
          executor: profileKey as BaseCodingAgent,
        });
        // Store the McpConfig from backend
        setMcpConfig(result.mcp_config);
        // Create the full configuration structure using the schema
        const fullConfig = McpConfigStrategyGeneral.createFullConfig(
          result.mcp_config
        );
        const configJson = JSON.stringify(fullConfig, null, 2);
        setMcpServers(configJson);
        setMcpConfigPath(result.config_path);
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          err.message.includes('does not support MCP')
        ) {
          setMcpError(err.message);
        } else {
          console.error('Error loading MCP servers:', err);
        }
      } finally {
        setMcpLoading(false);
      }
    };

    // Load MCP servers for the selected profile
    if (selectedProfile) {
      loadMcpServersForProfile(selectedProfile);
    }
  }, [selectedProfile, profiles]);

  const handleMcpServersChange = (value: string) => {
    setMcpServers(value);
    setMcpError(null);

    // Validate JSON on change
    if (value.trim() && mcpConfig) {
      try {
        const parsedConfig = JSON.parse(value);
        // Validate using the schema path from backend
        McpConfigStrategyGeneral.validateFullConfig(mcpConfig, parsedConfig);
      } catch (err) {
        if (err instanceof SyntaxError) {
          setMcpError(t('settings.mcp.errors.invalidJson'));
        } else {
          setMcpError(
            err instanceof Error
              ? err.message
              : t('settings.mcp.errors.validationError')
          );
        }
      }
    }
  };

  const handleApplyMcpServers = async () => {
    if (!selectedProfile || !mcpConfig) return;

    setMcpApplying(true);
    setMcpError(null);

    try {
      // Validate and save MCP configuration
      if (mcpServers.trim()) {
        try {
          const fullConfig = JSON.parse(mcpServers);
          McpConfigStrategyGeneral.validateFullConfig(mcpConfig, fullConfig);
          const mcpServersConfig =
            McpConfigStrategyGeneral.extractServersForApi(
              mcpConfig,
              fullConfig
            );

          // Find the key for the selected profile
          const selectedProfileKey = profiles
            ? Object.keys(profiles).find(
                (key) => profiles[key] === selectedProfile
              )
            : null;
          if (!selectedProfileKey) {
            throw new Error('Selected profile key not found');
          }

          await mcpServersApi.save(
            {
              executor: selectedProfileKey as BaseCodingAgent,
            },
            { servers: mcpServersConfig }
          );

          // Show success feedback
          Toast.success(t('settings.mcp.save.successMessage'));
        } catch (mcpErr) {
          if (mcpErr instanceof SyntaxError) {
            setMcpError(t('settings.mcp.errors.invalidJson'));
          } else {
            setMcpError(
              mcpErr instanceof Error
                ? mcpErr.message
                : t('settings.mcp.errors.saveFailed')
            );
          }
        }
      }
    } catch (err) {
      setMcpError(t('settings.mcp.errors.applyFailed'));
      Toast.error(t('settings.mcp.errors.applyFailed'));
      console.error('Error applying MCP servers:', err);
    } finally {
      setMcpApplying(false);
    }
  };

  const addServer = (key: string) => {
    try {
      const existing = mcpServers.trim() ? JSON.parse(mcpServers) : {};
      const updated = McpConfigStrategyGeneral.addPreconfiguredToConfig(
        mcpConfig!,
        existing,
        key
      );
      setMcpServers(JSON.stringify(updated, null, 2));
      setMcpError(null);
    } catch (err) {
      console.error(err);
      setMcpError(
        err instanceof Error
          ? err.message
          : t('settings.mcp.errors.addServerFailed')
      );
    }
  };

  const preconfiguredObj = (mcpConfig?.preconfigured ?? {}) as Record<
    string,
    unknown
  >;
  const meta =
    typeof preconfiguredObj.meta === 'object' && preconfiguredObj.meta !== null
      ? (preconfiguredObj.meta as Record<
          string,
          { name?: string; description?: string; url?: string; icon?: string }
        >)
      : {};
  const servers = Object.fromEntries(
    Object.entries(preconfiguredObj).filter(([k]) => k !== 'meta')
  ) as Record<string, unknown>;
  const getMetaFor = (key: string) => meta[key] || {};

  const serverKeys = Object.keys(servers);
  const chunkSize = 4;
  const serverPages: string[][] = [];
  for (let i = 0; i < serverKeys.length; i += chunkSize) {
    serverPages.push(serverKeys.slice(i, i + chunkSize));
  }

  if (!config) {
    return (
      <div className="py-8">
        <Banner
          type="danger"
          fullMode={false}
          description={t('settings.mcp.errors.loadFailed')}
        />
      </div>
    );
  }

  const selectedProfileKey =
    selectedProfile && profiles
      ? Object.keys(profiles).find((key) => profiles[key] === selectedProfile) ||
        ''
      : '';

  return (
    <div className="space-y-6">
      {!!mcpError && (
        <Banner
          type={mcpError.includes('does not support MCP') ? 'warning' : 'danger'}
          fullMode={false}
          description={t('settings.mcp.errors.mcpError', { error: mcpError })}
        />
      )}

      <Card
        title={t('settings.mcp.title')}
        headerExtraContent={
          <Typography.Text type="tertiary">
            {t('settings.mcp.description')}
          </Typography.Text>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Typography.Text strong>{t('settings.mcp.labels.agent')}</Typography.Text>
            <Select
              value={selectedProfileKey}
              placeholder={t('settings.mcp.labels.agentPlaceholder')}
              optionList={Object.keys(profiles || {})
                .sort((a, b) => a.localeCompare(b))
                .map((profileKey) => ({
                  value: profileKey,
                  label: profileKey,
                }))}
              onChange={(value) => {
                const profile = profiles?.[String(value)];
                if (profile) setSelectedProfile(profile);
              }}
            />
            <Typography.Text type="tertiary">
              {t('settings.mcp.labels.agentHelper')}
            </Typography.Text>
          </div>

          {mcpError && mcpError.includes('does not support MCP') ? (
            <Banner
              type="warning"
              fullMode={false}
              title={t('settings.mcp.errors.notSupported')}
              description={
                <>
                  <div>{mcpError}</div>
                  <div>{t('settings.mcp.errors.supportMessage')}</div>
                </>
              }
            />
          ) : (
            <div className="space-y-2">
              <Typography.Text strong>
                {t('settings.mcp.labels.serverConfig')}
              </Typography.Text>
              <JSONEditor
                id="mcp-servers"
                placeholder={
                  mcpLoading
                    ? t('settings.mcp.save.loading')
                    : '{\n  "server-name": {\n    "type": "stdio",\n    "command": "your-command",\n    "args": ["arg1", "arg2"]\n  }\n}'
                }
                value={
                  mcpLoading ? t('settings.mcp.loading.jsonEditor') : mcpServers
                }
                onChange={handleMcpServersChange}
                disabled={mcpLoading}
                minHeight={300}
              />
              {mcpError && !mcpError.includes('does not support MCP') && (
                <Typography.Text type="danger">{mcpError}</Typography.Text>
              )}
              <Typography.Text type="tertiary">
                {mcpLoading ? (
                  t('settings.mcp.loading.configuration')
                ) : (
                  <>
                    {t('settings.mcp.labels.saveLocation')}{' '}
                    {!!mcpConfigPath && (
                      <Typography.Text code type="tertiary">
                        {mcpConfigPath}
                      </Typography.Text>
                    )}
                  </>
                )}
              </Typography.Text>

              {mcpConfig?.preconfigured &&
                typeof mcpConfig.preconfigured === 'object' && (
                  <div className="pt-4">
                    <Typography.Text strong>
                      {t('settings.mcp.labels.popularServers')}
                    </Typography.Text>
                    <Typography.Text type="tertiary">
                      {t('settings.mcp.labels.serverHelper')}
                    </Typography.Text>

                    <div className="relative overflow-hidden rounded-xl border border-[var(--semi-color-border)]">
                      <div className="w-full px-4 py-3">
                        {serverPages.length === 0 ? (
                          <Typography.Text type="tertiary">
                            {t('settings.mcp.labels.noPopularServers', {
                              defaultValue: 'No popular servers available.',
                            })}
                          </Typography.Text>
                        ) : (
                          <Carousel
                            showArrow
                            showIndicator={false}
                            arrowType="hover"
                            theme="light"
                            className="w-full"
                          >
                            {serverPages.map((pageKeys, idx) => (
                              <div key={idx} className="grid grid-cols-2 gap-3">
                                {pageKeys.map((key) => {
                                  const metaObj = getMetaFor(key) as {
                                    name?: string;
                                    description?: string;
                                    url?: string;
                                    icon?: string;
                                  };
                                  const name = metaObj.name || key;
                                  const description =
                                    metaObj.description || 'No description';
                                  const icon = metaObj.icon
                                    ? `/${metaObj.icon}`
                                    : null;

                                  return (
                                    <Button
                                      key={key}
                                      theme="borderless"
                                      onClick={() => addServer(key)}
                                      className="w-full p-0"
                                    >
                                      <Card
                                        bordered
                                        className="h-32"
                                        title={
                                          <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-6 h-6 rounded-lg border border-[var(--semi-color-border)] grid place-items-center overflow-hidden">
                                              {icon ? (
                                                <img
                                                  src={icon}
                                                  alt=""
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <span className="font-semibold">
                                                  {name.slice(0, 1).toUpperCase()}
                                                </span>
                                              )}
                                            </div>
                                            <Typography.Text strong ellipsis>
                                              {name}
                                            </Typography.Text>
                                          </div>
                                        }
                                      >
                                        <Typography.Text type="tertiary">
                                          {description}
                                        </Typography.Text>
                                      </Card>
                                    </Button>
                                  );
                                })}
                              </div>
                            ))}
                          </Carousel>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </Card>

      {/* Sticky Save Button */}
      <div className="sticky bottom-0 z-10">
        <div className="flex justify-end">
          <Button
            type="primary"
            onClick={handleApplyMcpServers}
            disabled={mcpApplying || mcpLoading || !!mcpError}
            loading={mcpApplying}
          >
            {t('settings.mcp.save.button')}
          </Button>
        </div>
      </div>
    </div>
  );
}
