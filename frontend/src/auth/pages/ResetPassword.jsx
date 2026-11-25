import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import authService, { PASSWORD_MIN_LENGTH } from '../authService';

/**
 * Choose a new password from an emailed link: /reset-password?token=… (post-deploy T4). A successful reset signs out
 * every device, so the page sends the user to log in again rather than logging them in itself.
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match");
      return;
    }
    setSaving(true);
    const result = await authService.resetPassword(token, password);
    setSaving(false);
    if (result.success) setDone(result.message);
    else setError(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> Choose a new password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <p data-testid="reset-no-token" className="text-sm text-destructive">
              This page needs the link from your reset email. <Link to="/forgot-password" className="underline">Request a new one</Link>.
            </p>
          ) : done ? (
            <div data-testid="reset-done" className="space-y-3 text-sm">
              <p className="text-foreground">{done}</p>
              <Button asChild className="w-full"><Link to="/login">Go to login</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">At least {PASSWORD_MIN_LENGTH} characters.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" data-testid="reset-error">
                  {error}
                  {/invalid or has expired/i.test(error) && (
                    <> <Link to="/forgot-password" className="underline">Request a new link</Link>.</>
                  )}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Saving…' : 'Set new password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
