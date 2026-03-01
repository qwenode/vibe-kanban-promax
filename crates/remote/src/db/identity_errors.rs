use thiserror::Error;

#[derive(Debug, Error)]
pub enum IdentityError {
    #[error("identity record not found")]
    NotFound,
    #[error("permission denied: admin access required")]
    PermissionDenied,
    #[error(transparent)]
    Database(#[from] sqlx::Error),
}
