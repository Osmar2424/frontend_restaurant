import React, { useState, useEffect } from 'react';
import { Users, Shield, UserPlus, Trash2, Mail, Lock, User as UserIcon } from 'lucide-react';
import type { User, Role } from '../../types';
import { register as registerUser } from '../../services/auth.service';
import { styles } from './styles';
import { deleteUser, getUsers } from '../../services/usuario.service';
import { getRoles } from '../../services/rol.service';
import { handleUIError } from '../utils';

export const AdministrationView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const fetchData = async () => {
    try {
      const usersResponse = await getUsers();
      const rolesResponse = await getRoles();
      setUsers(usersResponse);
      setRoles(rolesResponse);

      // Por defecto selecciona el primer rol
      if (rolesResponse.length > 0) {
        setSelectedRoleId(rolesResponse[0].idRol.toString());
      }
    } catch (err) {
      handleUIError(err, setError, 'No se pudo obtener la información de los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleRegister = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !email.trim() || !password || !selectedRoleId) {
      setError('Por favor complete todos los campos.');
      return;
    }

    try {
      // Use the centralized register service
      await registerUser({
        fullName: fullName.trim(),
        email: email.trim(),
        hashPassword: password,
        idRol: parseInt(selectedRoleId, 10)
      });

      setSuccess('Usuario registrado con éxito.');
      setFullName('');
      setEmail('');
      setPassword('');
      fetchData(); // Refresh list
    } catch (err) {
      handleUIError(err, setError, 'Se produjo un error al intentar registrar un nuevo usuario.');
    }
  };

  const handleDeleteUser = async (idUsuario: number) => {
    // Prevent deleting oneself
    const currentUserProfile = localStorage.getItem('umami_user');
    if (currentUserProfile) {
      const parsed = JSON.parse(currentUserProfile);
      if (parsed.idUsuario === idUsuario) {
        alert('No puedes eliminar tu propio usuario.');
        return;
      }
    }

    if (!window.confirm('¿Confirmas que deseas eliminar este usuario del sistema?')) {
      return;
    }

    try {
      await deleteUser(idUsuario);
      setSuccess('Usuario eliminado.');
      fetchData();
    } catch (err) {
      handleUIError(err, setError, 'No se pudo eliminar al usuario.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Administración de Personal</h1>
          <p style={styles.subtitle}>Gestión de operadores, roles y acceso al sistema REStBack</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-error-border)', borderRadius: '10px', color: 'var(--color-error)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--color-ready-border)', borderRadius: '10px', color: 'var(--color-ready)', fontSize: '0.85rem' }}>
          {success}
        </div>
      )}

      <div style={styles.adminLayout}>
        {/* User list card */}
        <div className="glass-panel" style={styles.panelCard}>
          <div style={styles.cardHeader}>
            <Users size={20} color="var(--primary)" />
            <h3 style={styles.cardTitle}>Personal Registrado</h3>
          </div>
          <div style={{ ...styles.cardBody, overflowX: 'auto' }}>
            {users.length > 0 ? (
              <table style={styles.usersTable}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{ padding: '0.75rem' }}>Nombre</th>
                    <th style={{ padding: '0.75rem' }}>Email</th>
                    <th style={{ padding: '0.75rem' }}>Rol</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.idUsuario} style={styles.tableRow}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={styles.userCell}>
                          <div style={styles.avatar}>
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <strong style={{ color: 'var(--text-primary)' }}>{u.fullName}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={styles.roleBadge}>
                          {u.rol?.nameRol || `Rol #${u.idRol}`}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleDeleteUser(u.idUsuario)}
                            style={styles.actionBtn}
                            title="Eliminar usuario"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                {loading ? 'Cargando personal...' : 'No hay usuarios registrados.'}
              </div>
            )}
          </div>
        </div>

        {/* Add user form */}
        <div className="glass-panel" style={styles.panelCard}>
          <div style={styles.cardHeader}>
            <UserPlus size={20} color="var(--color-ready)" />
            <h3 style={styles.cardTitle}>Nuevo Operador</h3>
          </div>
          <form onSubmit={handleRegister}>
            <div style={styles.cardBody}>
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <UserIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="juan.perez@restback.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Rol del Personal</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Shield size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
                  <select
                    className="form-input"
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    style={{ paddingLeft: '2.25rem', appearance: 'none', backgroundPosition: 'right 1rem center' }}
                    required
                  >
                    {roles.map((r) => (
                      <option key={r.idRol} value={r.idRol}>
                        {r.nameRol.toUpperCase()} ({r.description})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <UserPlus size={16} /> Registrar Operador
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
