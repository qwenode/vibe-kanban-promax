use thiserror::Error;

#[derive(Debug, Error)]
pub enum IdentityError {
    #[error("identity record not found")]
    NotFound,
    #[error("permission denied: admin access required")]
    PermissionDenied,
    #[error(transparent)]
    Database(#[from] sqlx::Error),
    #[cfg(feature = "vk-billing")]
    #[error("billing error: {0}")]
    Billing(crate::billing::BillingCheckError),
}

#[cfg(feature = "vk-billing")]
impl From<crate::billing::BillingCheckError> for IdentityError {
    fn from(err: crate::billing::BillingCheckError) -> Self {
        Self::Billing(err)
    }
}

#[cfg(not(feature = "vk-billing"))]
impl From<crate::billing::BillingCheckError> for IdentityError {
    fn from(err: crate::billing::BillingCheckError) -> Self {
        match err {}
    }
}
