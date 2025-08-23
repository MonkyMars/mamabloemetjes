use crate::pool::connect::pool;
use crate::structs::contact::ContactForm;
use sqlx::{Error as SqlxError, Row};

pub async fn post_contact_form(contact_form: &ContactForm) -> Result<ContactForm, SqlxError> {
    let pool = pool();

    let row = sqlx::query(
        r#"
        INSERT INTO contact_forms (
         name, email, message, phone, product_id, occasion, preferred_contact_method
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, email, message, phone, product_id, occasion, preferred_contact_method, created_at
        "#,
    )
    .bind(&contact_form.name)
    .bind(&contact_form.email)
    .bind(&contact_form.message)
    .bind(&contact_form.phone)
    .bind(&contact_form.product_id)
    .bind(&contact_form.occasion)
    .bind(&contact_form.preferred_contact_method)
    .fetch_one(pool)
    .await?;

    let contact_form = ContactForm {
        id: row.get("id"),
        name: row.get("name"),
        email: row.get("email"),
        message: row.get("message"),
        phone: row.get("phone"),
        product_id: row.get("product_id"),
        occasion: row.get("occasion"),
        preferred_contact_method: row.get("preferred_contact_method"),
        created_at: row.get("created_at"),
    };

    Ok(contact_form)
}
