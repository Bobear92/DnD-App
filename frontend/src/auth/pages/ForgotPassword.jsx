import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import authService from '../authService';

/**
 * Ask for a password-reset link (post-deploy T4). The server replies the same whether or not the account exists, so
 * this page always shows that same reply — it never says "no such account".
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    const result = await authService.forgotPassword(email.trim());
    setSending(false);
    if (result.success) setSentMessage(result.message);
    else setError(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Forgot your password?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sentMessage ? (
            <div data-testid="forgot-sent" className="space-y-3 text-sm">
              <p className="text-foreground">{sentMessage}</p>
              <p className="text-muted-foreground">The link expires in an hour. Check your spam folder if it doesn't arrive.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enter the email you registered with and we'll send you a link to choose a new password.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={sending || !email.trim()}>
                {sending ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          )}
          <p className="text-sm text-center">
            <Link to="/login" className="text-primary hover:underline">Back to login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
