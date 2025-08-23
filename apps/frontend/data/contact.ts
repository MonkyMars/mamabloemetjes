import api from '@/lib/axios';
import { ContactForm } from '@/types';

export const sendContactForm = async (
  contact_form: ContactForm,
): Promise<void> => {
  console.warn('Sending contact form', contact_form);
  const {
    name,
    email,
    phone,
    message,
    preferred_contact_method,
    occasion,
    product_id,
  } = contact_form;
  return api
    .post('/contact', {
      name,
      email,
      phone,
      preferred_contact_method,
      occasion,
      message,
      product_id,
    })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('Failed to send contact form');
      }
    });
};
