import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ContactPage from './ContactPage';
import { contactService } from '../../services/database.service';

vi.mock('../../services/database.service', () => ({
  contactService: {
    save: vi.fn().mockResolvedValue({ success: true, data: { id: 'test-123' } }),
  },
}));

describe('ContactPage', () => {
  it('renders contact page heading and inputs properly', () => {
    render(<ContactPage />);
    expect(screen.getByRole('heading', { name: /get in touch with/i })).toBeDefined();
    expect(screen.getByPlaceholderText(/alex mercer/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/alex@company.com/i)).toBeDefined();
  });

  it('handles form submission successfully', async () => {
    render(<ContactPage />);
    const nameInput = screen.getByPlaceholderText(/alex mercer/i);
    const emailInput = screen.getByPlaceholderText(/alex@company.com/i);
    const messageInput = screen.getByPlaceholderText(/describe the bug or problem/i);
    const submitBtn = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(messageInput, { target: { value: 'Testing contact bug fix' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(contactService.save).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Report a Bug / Website Issue',
        message: 'Testing contact bug fix',
      });
      expect(screen.getByText(/thank you for your feedback!/i)).toBeDefined();
    });
  });
});
