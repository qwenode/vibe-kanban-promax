use sqlx::PgPool;
use uuid::Uuid;

use super::identity_errors::IdentityError;

/// Verify that a project exists. Returns the project's organization_id.
pub(crate) async fn assert_project_access(
    pool: &PgPool,
    project_id: Uuid,
    _user_id: Uuid,
) -> Result<(), IdentityError> {
    let exists = sqlx::query_scalar!(
        r#"SELECT EXISTS(SELECT 1 FROM projects WHERE id = $1) AS "exists!"#,
        project_id
    )
    .fetch_one(pool)
    .await?;

    if exists {
        Ok(())
    } else {
        Err(IdentityError::NotFound)
    }
}

/// Verify that an issue exists.
pub(crate) async fn assert_issue_access(
    pool: &PgPool,
    issue_id: Uuid,
    _user_id: Uuid,
) -> Result<(), IdentityError> {
    let exists = sqlx::query_scalar!(
        r#"SELECT EXISTS(SELECT 1 FROM issues WHERE id = $1) AS "exists!"#,
        issue_id
    )
    .fetch_one(pool)
    .await?;

    if exists {
        Ok(())
    } else {
        Err(IdentityError::NotFound)
    }
}
