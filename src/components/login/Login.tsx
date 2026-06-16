import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, Key, User as UserIcon, LogIn, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { styles } from './styles';
import { login as loginService } from '../../services/auth.service.ts';
import { useAuth } from '../../context/authContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Generate a random captcha code
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded hard to distinguish characters like O, 0, I, 1
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  // Draw the captcha on the canvas
  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#111827');
    bgGrad.addColorStop(1, '#1f2937');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.25)`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Draw captcha text with distortions
    ctx.textBaseline = 'middle';
    const charWidth = canvas.width / (captchaCode.length + 1);
    const fonts = ['Arial', 'Courier New', 'Georgia', 'Impact', 'Trebuchet MS'];

    for (let i = 0; i < captchaCode.length; i++) {
      const char = captchaCode[i];
      const fontSize = Math.floor(Math.random() * 8) + 20; // size between 20px and 28px
      ctx.font = `bold ${fontSize}px ${fonts[Math.floor(Math.random() * fonts.length)]}`;
      ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 70%)`; // Bright HSL colors

      const x = (i + 0.5) * charWidth + (Math.random() * 5 - 2.5);
      const y = canvas.height / 2 + (Math.random() * 6 - 3);

      // Distort with rotation
      ctx.save();
      ctx.translate(x, y);
      const angle = (Math.random() * 40 - 20) * Math.PI / 180; // -20 to 20 degrees
      ctx.rotate(angle);
      ctx.fillText(char, -charWidth / 4, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (captchaCode) {
      drawCaptcha();
    }
  }, [captchaCode]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingresa correo y contraseña.');
      return;
    }

    // Validate captcha (case insensitive)
    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setError('Captcha incorrecto. Inténtalo de nuevo.');
      generateCaptcha();
      return;
    }

    setLoading(true);

    try {
      // Login API request. El backend espera email y hashPassword.
      const response = await loginService({
        email: email.trim(),
        hashPassword: password,
      });

      const token = response.token;

      if (!token) {
        throw new Error('No se recibió token de autenticación');
      }

      login(token);
      navigate('/');

    } catch (err: any) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.message || 'Error de autenticación. Verifica tus credenciales.';
      setError(Array.isArray(errMsg) ? errMsg[0] : errMsg);
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.iconWrapper}>
            <ChefHat size={38} color="var(--primary)" />
          </div>
          <h1 style={styles.title}>REStBack</h1>
          <p style={styles.subtitle}>Gestión inteligente de cocina y caja</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div style={styles.inputWrapper}>
              <UserIcon size={18} color="var(--text-secondary)" style={styles.inputIcon} />
              <input
                type="email"
                className="form-input"
                placeholder="ejemplo@restback.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={styles.inputWrapper}>
              <Key size={18} color="var(--text-secondary)" style={styles.inputIcon} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Captcha Section */}
          <div className="form-group" style={styles.captchaContainer}>
            <label className="form-label">Código de Seguridad (Captcha)</label>
            <div style={styles.captchaRow}>
              <canvas
                ref={canvasRef}
                width={150}
                height={42}
                style={styles.captchaCanvas}
                onClick={generateCaptcha}
                title="Haga clic para regenerar"
              />
              <button
                type="button"
                style={styles.refreshBtn}
                onClick={generateCaptcha}
                title="Regenerar captcha"
                disabled={loading}
              >
                <RotateCw size={16} />
              </button>
              <input
                type="text"
                className="form-input"
                placeholder="Código"
                style={styles.captchaInput}
                value={captchaInput}
                onChange={(e) => {
                  setCaptchaInput(e.target.value);
                  setError('');
                }}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Iniciando...' : <><LogIn size={18} /> Iniciar Sesión</>}
          </button>
        </form>
      </div>
    </div>
  );
};
