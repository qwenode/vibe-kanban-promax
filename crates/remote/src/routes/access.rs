use axum::http::StatusCode;
use sqlx::PgPool;
use tracing::warn;
use uuid::Uuid;

use super::error::ErrorResponse;
use crate::db::{issues::IssueRepository, projects::ProjectRepository};

/// Verify the user has access to a project. Returns the project's organization_id.
pub(crate) async fn ensure_project_access(
    pool: &PgPool,
    user_id: Uuid,
    project_id: Uuid,
) -> Result<Uuid, ErrorResponse> {
    let organization_id = ProjectRepository::organization_id(pool, project_id)
        .await
        .map_err(|error| {
            tracing::error!(?error, %project_id, "failed to load project");
            ErrorResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "internal server error")
        })?
        .ok_or_else(|| {
            warn!(%project_id, %user_id, "project not found for access check");
            ErrorResponse::new(StatusCode::NOT_FOUND, "project not found")
        })?;

    Ok(organization_id)
}

/// Verify the user has access to an issue. Returns the issue's organization_id.
pub(crate) async fn ensure_issue_access(
    pool: &PgPool,
    user_id: Uuid,
    issue_id: Uuid,
) -> Result<Uuid, ErrorResponse> {
    let organization_id = IssueRepository::organization_id(pool, issue_id)
        .await
        .map_err(|error| {
            tracing::error!(?error, %issue_id, "failed to load issue");
            ErrorResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "internal server error")
        })?
        .ok_or_else(|| {
            warn!(%issue_id, %user_id, "issue not found for access check");
            ErrorResponse::new(StatusCode::NOT_FOUND, "issue not found")
        })?;

    Ok(organization_id)
}
