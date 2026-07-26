import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound, ShieldAlert, Sparkles, Check, Eye, EyeOff, ShieldCheck, Gamepad2, Settings, AlertCircle } from 'lucide-react';

interface PasscodeLockModalProps {
  onUnlock: () => void;
  savedPasscode: string;
  onUpdatePasscode: (newPasscode: string) => void;
}

export const PasscodeLockModal: React.FC<PasscodeLockModalProps> = ({
  onUnlock,
  savedPasscode,
  onUpdatePasscode
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Reset / Change Passcode Mode State
  const [showChangePasscode, setShowChangePasscode] = useState(false);
  const [oldPasscode, setOldPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  const handleKeyPadClick = (val: string) => {
    if (passcode.length < 12) {
      setPasscode(prev => prev + val);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPasscode('');
    setErrorMsg(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passcode) {
      setErrorMsg('Please enter your master passcode.');
      return;
    }

    if (passcode === savedPasscode) {
      setErrorMsg(null);
      onUnlock();
    } else {
      setErrorMsg('Incorrect master passcode. Access denied!');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPasscode('');
    }
  };

  const handleChangePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);

    if (oldPasscode !== savedPasscode) {
      setChangeError('Current master passcode is incorrect.');
      return;
    }

    if (!newPasscode || newPasscode.length < 4) {
      setChangeError('New passcode must be at least 4 digits/characters.');
      return;
    }

    if (newPasscode !== confirmPasscode) {
      setChangeError('New passcodes do not match.');
      return;
    }

    onUpdatePasscode(newPasscode);
    setChangeSuccess(true);
    setOldPasscode('');
    setNewPasscode('');
    setConfirmPasscode('');

    setTimeout(() => {
      setChangeSuccess(false);
      setShowChangePasscode(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in select-none">
      
      {/* Background Decorative Neon Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[300px] h-[200px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div
        className={`relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isShaking ? 'animate-bounce border-rose-500/80 shadow-rose-900/30' : 'shadow-indigo-950/40'
        }`}
        id="passcode-lock-card"
      >
        {/* Top Header Badge */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 text-center border-b border-slate-800/80 relative">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-3 shadow-lg shadow-indigo-600/20">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center justify-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-400" />
            <span>Master Passcode Vault</span>
          </h2>
          
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Private Backlog Protection enabled. Enter passcode to access your games.
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-indigo-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Security: Cloud Sync Active</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5">
          {!showChangePasscode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Passcode Field with Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Master Passcode
                </label>
                
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-500">
                    <KeyRound className="w-4 h-4 text-indigo-400" />
                  </div>
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Enter passcode..."
                    autoFocus
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono font-bold text-lg text-slate-100 tracking-widest focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    id="input-passcode-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {errorMsg && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-1.5 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* On-screen Keypad (Optional quick tap) */}
              <div className="grid grid-cols-3 gap-2 py-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={`keypad-${digit}`}
                    type="button"
                    onClick={() => handleKeyPadClick(digit)}
                    className="py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-mono text-base font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-semibold transition-all cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyPadClick('0')}
                  className="py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-mono text-base font-bold transition-all active:scale-95 cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-semibold transition-all cursor-pointer"
                >
                  ⌫
                </button>
              </div>

              {/* Submit unlock button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                id="btn-unlock-vault"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Backlog Vault</span>
              </button>

              {/* Default Passcode Hint / Info */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Default Passcode: <code className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300 font-bold">1234</code></span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowChangePasscode(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                >
                  Change Passcode
                </button>
              </div>

            </form>
          ) : (
            /* Change Passcode View */
            <form onSubmit={handleChangePasscodeSubmit} className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>Set New Master Passcode</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowChangePasscode(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {changeSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Passcode updated successfully!</span>
                </div>
              )}

              {changeError && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{changeError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Current Passcode
                </label>
                <input
                  type="password"
                  required
                  value={oldPasscode}
                  onChange={(e) => setOldPasscode(e.target.value)}
                  placeholder="Current passcode..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Passcode (min 4 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="New passcode..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm New Passcode
                </label>
                <input
                  type="password"
                  required
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  placeholder="Confirm new passcode..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Save Passcode
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangePasscode(false)}
                  className="py-2 px-3 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs rounded-lg cursor-pointer"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Note */}
        <div className="bg-slate-950/80 p-3 text-center border-t border-slate-800/80 text-[11px] text-slate-400">
          Passcode is synced live across all your browsers and devices via Firebase Cloud.
        </div>

      </div>
    </div>
  );
};
