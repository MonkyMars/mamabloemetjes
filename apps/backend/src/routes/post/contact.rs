use axum::Json;

use crate::{
    actions::post::contact::post_contact_form,
    response::{ApiResponse, AppError, AppResponse},
    structs::contact::ContactForm,
};

pub async fn contact(Json(payload): Json<ContactForm>) -> ApiResponse<ContactForm> {
    match post_contact_form(&payload).await {
        Ok(contact_form) => AppResponse::Success(contact_form),
        Err(e) => AppResponse::Error(AppError::DatabaseError(format!(
            "Failed to submit contact form due to a database error: {}. Please try again later or contact support if the problem persists.",
            e
        ))),
    }
}
