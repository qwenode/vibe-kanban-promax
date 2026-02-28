use chrono::{DateTime, Utc};
use serde::Serialize;
use ts_rs::TS;

/// Response from GET /api/auth/token - returns the current access token
#[derive(Debug, Serialize, TS)]
#[ts(export)]
pub struct TokenResponse {
    pub access_token: String,
    pub expires_at: Option<DateTime<Utc>>,
}

/// Response from GET /api/auth/user - returns the current user ID
#[derive(Debug, Serialize, TS)]
#[ts(export)]
pub struct CurrentUserResponse {
    pub user_id: String,
}
