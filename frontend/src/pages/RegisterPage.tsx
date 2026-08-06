import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/auth.service';
import { Phone, Lock, Mail, User, Building, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    AuthService.getSetupStatus()
      .then(({ isFirstUser: first }) => setIsFirstUser(first))
      .catch(() => setIsFirstUser(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        ...(isFirstUser && workspaceName ? { workspaceName } : {}),
      });
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Échec de l\'inscription. Veuillez vérifier les informations.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFirstUser === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Phone className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            {isFirstUser ? 'Créer un Espace RingCRM' : 'Rejoindre l\'équipe'}
          </h2>
          <p className="text-xs text-slate-400">
            {isFirstUser
              ? 'Le premier compte devient Administrateur de l\'espace.'
              : 'Votre compte sera créé en tant qu\'Agent et apparaîtra dans la page Équipe.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Prénom</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Nom</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {isFirstUser && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Nom de l'entreprise / Espace</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Acme Telecom SAS"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Adresse email professionnelle</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="j.dupont@entreprise.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Mot de passe (min 6 car.)</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Création en cours...</span>
            ) : (
              <>
                <span>{isFirstUser ? 'Créer mon espace Administrateur' : 'Créer mon compte Agent'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
