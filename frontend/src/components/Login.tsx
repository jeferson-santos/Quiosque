import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import { loginApi, getUserByUsername } from '../config/api';

import {
  Container,
  Box,
  TextField,
  Alert,
  Modal,
  Collapse,
  IconButton,
  Typography,
  Paper,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import Button from '@mui/material/Button';

interface FormValues {
  username: string;
  password: string;
}

interface LoginProps {
  onLogin?: (user: { username: string; role: string; [key: string]: any }) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(true);
  const [username, setUsername] = useState('');

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setUsername(value);
  };

  const handleClose = () => setOpen(false);

  const navigate = useNavigate();
  useEffect(() => {
    // Se já existe token, redireciona
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const schema = Yup.object().shape({
    username: Yup.string().required('Usuário é obrigatório'),
    password: Yup.string().required('Senha é obrigatória'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });

  const handleLogin = async (formValue: FormValues) => {
    const { password } = formValue;
    const usernameLower = username.toLowerCase(); // Garantir que seja minúsculo
    setMessage('');
    setLoading(true);
    try {
      const data = await loginApi(usernameLower, password);
      localStorage.setItem('token', data.access_token);
      // Buscar dados do usuário autenticado
      const userData = await getUserByUsername(usernameLower);
      localStorage.setItem('user', JSON.stringify(userData));
      if (onLogin) {
        onLogin(userData);
      }
      // Redirecionar conforme o papel
      if (userData.role === 'administrator') {
        navigate('/admin');
      } else if (userData.role === 'waiter') {
        navigate('/waiter');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      const resMessage =
        (error.response &&
          error.response.data &&
          (error.response.data.detail || error.response.data.message)) ||
        error.message ||
        error.toString();
      setLoading(false);
      setMessage(resMessage);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: 4,
              textAlign: 'center',
            }}
          >
            <RestaurantIcon sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
              {import.meta.env.VITE_RESTAURANT_NAME || 'Sistema de Pedidos'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Faça login para acessar o sistema
            </Typography>
          </Box>

          {/* Form */}
          <Box sx={{ padding: 4 }}>
            <Box
              component="form"
              onSubmit={handleSubmit(handleLogin)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
              noValidate
              autoComplete="off"
            >
              <TextField
                value={username}
                onChange={handleUsernameChange}
                onBlur={() => {
                  // Atualizar o valor do formulário quando o campo perder o foco
                  const event = { target: { name: 'username', value: username } } as any;
                  register('username').onChange(event);
                }}
                error={!!errors.username}
                helperText={errors.username?.message}
                label="Usuário"
                variant="outlined"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />

              <TextField
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                label="Senha"
                type="password"
                variant="outlined"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #b8c2f0 0%, #c4a8d8 100%)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    Entrando...
                  </Box>
                ) : (
                  'Entrar'
                )}
              </Button>
            </Box>

            {/* Error Modal */}
            {message && (
              <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box
                  sx={{
                    position: 'absolute' as const,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '90%', sm: 400 },
                    maxWidth: 400,
                  }}
                >
                  <Collapse in={open}>
                    <Alert
                      severity="error"
                      action={
                        <IconButton
                          aria-label="close"
                          color="inherit"
                          size="small"
                          onClick={() => {
                            setOpen(false);
                          }}
                        >
                          <CloseIcon fontSize="inherit" />
                        </IconButton>
                      }
                      sx={{
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {message}
                    </Alert>
                  </Collapse>
                </Box>
              </Modal>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;