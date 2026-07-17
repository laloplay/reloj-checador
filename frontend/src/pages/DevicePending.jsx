import { useLocation } from 'react-router-dom';
import { Clock, ShieldAlert } from 'lucide-react';
import { Logo } from '../components/Logo';

export function DevicePending({ estado: estadoProp }) {
  const location = useLocation();
  const estado = estadoProp || location.state?.estado ||'pendiente';

  const isPendiente = estado === 'pendiente';
  const titulo = isPendiente ? 'Dispositivo en espera' : 'Dispositivo no autorizado';
  const mensaje = isPendiente
    ? 'Este dispositivo está en espera de aprobación del administrador.'
    : 'Este dispositivo no tiene autorización para usar el sistema.';
  const Icon = isPendiente ? Clock : ShieldAlert;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <Logo size="lg" />
        </div>

        <div className="mb-8">
          <Icon
            size={64}
            className={`mx-auto mb-6 ${
              isPendiente ? 'text-yellow-500' : 'text-red-500'
            }`}
          />
        </div>

        <h1 className="text-3xl font-light text-white tracking-wide mb-4">
          {titulo}
        </h1>

        <p className="text-gray-300 text-lg mb-6 leading-relaxed">
          {mensaje}
        </p>

        <p className="text-gray-500 font-light text-sm tracking-wide">
          Contacta a tu administrador para más información
        </p>
      </div>
    </div>
  );
}
