import api from '@/lib/axios';
import { ContactForm } from '@/types';

export const sendContactForm = async (
  contact_form: ContactForm,
): Promise<void> => {
  return api.post('/contact', { contact_form }).then((response) => {
    if (response.status !== 200) {
      throw new Error('Failed to send contact form');
    }
  });
};
