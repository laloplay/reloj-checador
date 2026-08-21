import { useEffect, useRef, useState } from 'react';
import { Plus, Edit, UserX, X, Camera, Volume2 } from 'lucide-react';
import api from '../../services/api';

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
];

const normalizeDiasDescanso = (value) => {
    if (Array.isArray(value)) {
        return value.map(Number).filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6);
    }

    if (value === '' || value == null) {
        return [];
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? [parsed] : [];
};

export function AdminEmpleados() {
    const [empleados, setEmpleados] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [puestos, setPuestos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [empleadoEditando, setEmpleadoEditando] = useState(null);
    const [formData, setFormData] = useState({
        nombre_completo: '',
        fecha_ingreso: '',
        fecha_nacimiento: '',
        turno_id: '',
        sucursal_id: '',
        puesto_id: '',
        dia_descanso: [],
        registro_facial_pendiente: false,
        registro_facial_horas: 48,
        aplica_bono: true,
    });
    const [fotoBase64, setFotoBase64] = useState(null);
    const [camaraActiva, setCamaraActiva] = useState(false);
    const [streamCamara, setStreamCamara] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [empleadosRes, turnosRes, sucursalesRes, puestosRes] = await Promise.all([
                api.get('/empleados'),
                api.get('/turnos'),
                api.get('/sucursales'),
                api.get('/puestos'),
            ]);
            setEmpleados(empleadosRes.data);
            setTurnos(turnosRes.data);
            setSucursales(sucursalesRes.data);
            setPuestos(puestosRes.data);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setCargando(false);
        }
    };

    const abrirModalCrear = () => {
        setEmpleadoEditando(null);
        setFormData({
            nombre_completo: '',
            fecha_ingreso: '',
            fecha_nacimiento: '',
            turno_id: '',
            sucursal_id: '',
            puesto_id: '',
            dia_descanso: [],
            registro_facial_pendiente: false,
            registro_facial_horas: 48,
            aplica_bono: true,
        });
        setFotoBase64(null);
        setModalAbierto(true);
    };

    const abrirModalEditar = (empleado) => {
        setEmpleadoEditando(empleado);
        setFormData({
            nombre_completo: empleado.nombre_completo || '',
            fecha_ingreso: empleado.fecha_ingreso?.split('T')[0] || '',
            fecha_nacimiento: empleado.fecha_nacimiento?.split('T')[0] || '',
            turno_id: empleado.turno_id || '',
            sucursal_id: empleado.sucursal_id || '',
            puesto_id: empleado.puesto_id || '',
            dia_descanso: normalizeDiasDescanso(empleado.dia_descanso),
            registro_facial_pendiente: empleado.registro_facial_pendiente === true,
            registro_facial_horas: empleado.registro_facial_horas || 48,
            aplica_bono: empleado.aplica_bono !== false,
        });
        setFotoBase64(null);
        setModalAbierto(true);
    };

    const guardarEmpleado = async (e) => {
        e.preventDefault();

        if (!formData.nombre_completo) {
            alert('Por favor, completa el nombre completo del empleado.');
            return;
        }

        try {
            setGuardando(true);

            let empleadoGuardado;
            if (empleadoEditando) {
                const res = await api.put(`/empleados/${empleadoEditando.id}`, formData);
                empleadoGuardado = res.data;
            } else {
                const res = await api.post('/empleados', formData);
                empleadoGuardado = res.data;
            }

            if (fotoBase64) {
                await api.post(`/empleados/${empleadoGuardado.id}/foto`, {
                    imagen: fotoBase64,
                });
            }

            await cargarDatos();
            cerrarModal();
        } catch (error) {
            console.error('Error al guardar empleado:', error);
            alert('Error al guardar el empleado');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarEmpleado = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres desactivar este empleado? Ya no podrá realizar checadas.')) return;

        try {
            await api.delete(`/empleados/${id}`);
            await cargarDatos();
        } catch (error) {
            console.error('Error al eliminar empleado:', error);
            alert('Error al eliminar el empleado');
        }
    };

    const regenerarAudio = async (id) => {
        try {
            await api.post(`/empleados/${id}/regenerar-audio`);
            alert('Audio regenerado correctamente');
            await cargarDatos();
        } catch (error) {
            console.error('Error al regenerar el audio:', error);
            const backendMessage = error?.response?.data?.message;

            if (error?.response?.status === 503) {
                alert(backendMessage || 'AWS Polly no tiene permisos. Agrega polly:SynthesizeSpeech al usuario/rol de IAM.');
                return;
            }

            alert(backendMessage || 'Error al regenerar el audio');
        }
    };

    const activarCamara = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' }
            });
            setCamaraActiva(true);
            setStreamCamara(stream);

            // Esperar al siguiente tick para que el ref esté montado
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (error) {
            console.error('Error al acceder a la cámara:', error);
            alert('No se pudo acceder a la cámara');
        }
    };

    const detenerCamara = () => {
        if (streamCamara) {
            streamCamara.getTracks().forEach((track) => track.stop());
            setStreamCamara(null);
        }
        setCamaraActiva(false);
    };

    const capturarFoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Asegurarse de que el video tiene frame activo
        if (video.readyState < 2) {
            video.addEventListener('canplay', () => capturarFoto(), { once: true });
            return;
        }

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) return;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);

        const foto = canvas.toDataURL('image/jpeg', 0.95);
        setFotoBase64(foto);
        detenerCamara();
    };

    const cerrarModal = () => {
        detenerCamara();
        setFotoBase64(null);
        setModalAbierto(false);
    };

    if (cargando) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400 tracking-wide">Cargando empleados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-light text-white tracking-wide">Empleados</h1>
                        <p className="text-gray-400 text-sm mt-2">Gestiona el registro de empleados</p>
                    </div>
                    <button
                        onClick={abrirModalCrear}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
                    >
                        <Plus size={20} />
                        Nuevo empleado
                    </button>
                </div>

                {empleados.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 tracking-wide">No hay empleados registrados</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-blue-900/20">
                                    <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                        Nombre Completo
                                    </th>
                                    <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                        Turno
                                    </th>
                                    <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                        Sucursal
                                    </th>
                                    <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                        Puesto
                                    </th>
                                    <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                        Aplica Bono
                                    </th>
                                    <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                        Rostro
                                    </th>
                                    <th className="text-left py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                        Estado
                                    </th>
                                    <th className="text-center py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {empleados.map((empleado) => {
                                    const turno = turnos.find((t) => t.id === empleado.turno_id);
                                    const sucursal = sucursales.find((s) => s.id === empleado.sucursal_id);
                                    const puesto = puestos.find((p) => p.id === empleado.puesto_id);
                                    return (
                                        <tr
                                            key={empleado.id}
                                            className="border-b border-blue-900/10 hover:bg-blue-900/5 transition"
                                        >
                                            <td className="py-4 px-4 text-white font-medium">
                                                {empleado.nombre_completo}
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">
                                                {turno?.nombre || 'Sin asignar'}
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">
                                                {sucursal?.nombre || 'Sin asignar'}
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">
                                                {puesto?.nombre || 'Sin asignar'}
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">
                                                {empleado.aplica_bono ? (
                                                    <span className="text-green-400 font-semibold">✓ Sí</span>
                                                ) : (
                                                    <span className="text-gray-500">✗ No</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${empleado.face_id
                                                        ? 'bg-green-900/30 text-green-400 border-green-600/30'
                                                        : 'bg-gray-900/30 text-gray-400 border-gray-600/30'
                                                        }`}
                                                >
                                                    {empleado.face_id ? '✓ Registrado' : '○ Pendiente'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${empleado.activo
                                                        ? 'bg-green-900/30 text-green-400 border-green-600/30'
                                                        : 'bg-red-900/30 text-red-400 border-red-600/30'
                                                        }`}
                                                >
                                                    {empleado.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex gap-2 justify-center">
                                                    {empleado.face_id && (
                                                        <button
                                                            onClick={() => regenerarAudio(empleado.id)}
                                                            className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-900/30 text-emerald-400 border border-emerald-600/30 rounded-lg hover:bg-emerald-900/50 transition text-sm"
                                                            title="Regenerar audio"
                                                        >
                                                            <Volume2 size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => abrirModalEditar(empleado)}
                                                        className="inline-flex items-center gap-1 px-3 py-2 bg-blue-900/30 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-900/50 transition text-sm"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => eliminarEmpleado(empleado.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/30 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-900/50 transition text-sm"
                                                    >
                                                        <UserX size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalAbierto && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#111217] border border-blue-400/10 rounded-2xl w-full max-w-3xl overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-blue-400/10">
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-0.5">
                                    Gestión de personal
                                </p>
                                <h2 className="text-lg font-light text-gray-100 tracking-wide m-0">
                                    {empleadoEditando ? 'Editar empleado' : 'Nuevo empleado'}
                                </h2>
                            </div>
                            <button
                                onClick={cerrarModal}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body — dos columnas */}
                        <form onSubmit={guardarEmpleado}>
                            <div className="flex gap-0 max-h-[70vh] overflow-y-auto">

                                {/* Columna izquierda — inputs */}
                                <div className="flex-1 px-7 py-5 flex flex-col gap-4 border-r border-blue-400/10">

                                    <div>
                                        <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                                            Nombre completo
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nombre_completo}
                                            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                                            placeholder="Ej. María López García"
                                            className="w-full px-3 py-2.5 bg-[#1a1d27] border border-blue-400/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                                                Fecha de ingreso
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.fecha_ingreso}
                                                onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                                                className="w-full px-3 py-2.5 bg-[#1a1d27] border border-blue-400/20 rounded-lg text-gray-400 text-sm focus:outline-none focus:border-blue-500 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                                                Fecha de nacimiento
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.fecha_nacimiento}
                                                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                                                className="w-full px-3 py-2.5 bg-[#1a1d27] border border-blue-400/20 rounded-lg text-gray-400 text-sm focus:outline-none focus:border-blue-500 transition"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Turno</label>
                                        <select
                                            value={formData.turno_id}
                                            onChange={(e) => setFormData({ ...formData, turno_id: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-[#1a1d27] border border-blue-400/20 rounded-lg text-gray-400 text-sm focus:outline-none focus:border-blue-500 transition"
                                        >
                                            <option value="">Sin asignar</option>
                                            {turnos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Sucursal</label>
                                        <select
                                            value={formData.sucursal_id}
                                            onChange={(e) => setFormData({ ...formData, sucursal_id: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-[#1a1d27] border border-blue-400/20 rounded-lg text-gray-400 text-sm focus:outline-none focus:border-blue-500 transition"
                                        >
                                            <option value="">Sin asignar</option>
                                            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Puesto</label>
                                        <select
                                            value={formData.puesto_id}
                                            onChange={(e) => setFormData({ ...formData, puesto_id: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-[#1a1d27] border border-blue-400/20 rounded-lg text-gray-400 text-sm focus:outline-none focus:border-blue-500 transition"
                                        >
                                            <option value="">Sin asignar</option>
                                            {puestos.filter(p => p.activo).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-2">Días de descanso</label>
                                        <div className="grid grid-cols-2 gap-2 rounded-lg border border-blue-400/10 bg-[#1a1d27] p-3">
                                            {DAYS_OF_WEEK.map((day) => (
                                                <label key={day.value} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.dia_descanso.includes(day.value)}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setFormData((current) => {
                                                                const currentDays = current.dia_descanso || [];
                                                                return {
                                                                    ...current,
                                                                    dia_descanso: checked
                                                                        ? [...currentDays, day.value].sort((a, b) => a - b)
                                                                        : currentDays.filter((dia) => dia !== day.value),
                                                                };
                                                            });
                                                        }}
                                                        className="h-4 w-4 accent-blue-600"
                                                    />
                                                    <span>{day.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="mt-2 text-[11px] text-gray-500">Marca uno o varios días según el descanso fijo del empleado.</p>
                                    </div>

                                    <div className="space-y-3 rounded-lg border border-white/10 bg-neutral-900/60 p-4 backdrop-blur-md">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.registro_facial_pendiente}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    registro_facial_pendiente: e.target.checked,
                                                    registro_facial_horas: e.target.checked ? formData.registro_facial_horas : 48,
                                                })}
                                                className="h-4 w-4 accent-blue-600"
                                            />
                                            <span className="text-sm text-gray-200 font-medium">Registro facial pendiente</span>
                                        </label>

                                        {formData.registro_facial_pendiente && (
                                            <div>
                                                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Vencimiento</label>
                                                <select
                                                    value={formData.registro_facial_horas}
                                                    onChange={(e) => setFormData({ ...formData, registro_facial_horas: Number(e.target.value) })}
                                                    className="w-full px-3 py-2.5 bg-[#1a1d27] border border-blue-400/20 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-blue-500 transition"
                                                >
                                                    <option value={24}>24 horas</option>
                                                    <option value={48}>48 horas</option>
                                                    <option value={72}>72 horas</option>
                                                </select>
                                                <p className="mt-2 text-[11px] text-gray-500">El empleado tendrá este tiempo para registrar su rostro en la sucursal asignada.</p>
                                            </div>
                                        )}
                                    </div>

                                    <label className="flex items-center gap-3 px-3 py-2.5 bg-[#1a1d27] border border-blue-400/10 rounded-lg cursor-pointer hover:border-blue-400/25 transition">
                                        <input
                                            type="checkbox"
                                            checked={formData.aplica_bono}
                                            onChange={(e) => setFormData({ ...formData, aplica_bono: e.target.checked })}
                                            className="w-4 h-4 accent-blue-600"
                                        />
                                        <span className="text-sm text-gray-300">Elegible para bonos de puntualidad</span>
                                    </label>
                                </div>

                                {/* Columna derecha — cámara/foto */}
                                <div className="w-80 shrink-0 px-6 py-5 flex flex-col gap-3">
                                    <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium">
                                        Foto del rostro
                                    </label>

                                    {fotoBase64 ? (
                                        <div className="flex flex-col gap-2">
                                            <img
                                                src={fotoBase64}
                                                alt="Foto capturada"
                                                className="w-full aspect-square object-cover rounded-lg border border-blue-400/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => { setFotoBase64(null); activarCamara(); }}
                                                className="w-full py-2 bg-[#1a1d27] text-gray-400 border border-white/10 rounded-lg hover:bg-white/5 transition text-sm flex items-center justify-center gap-2"
                                            >
                                                <Camera size={14} />
                                                Retomar foto
                                            </button>
                                        </div>
                                    ) : camaraActiva ? (
                                        <div className="flex flex-col gap-2">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                onCanPlay={(e) => e.target.play()}
                                                className="w-full aspect-square object-cover rounded-lg border border-blue-400/20 bg-black"
                                            />
                                            <button
                                                type="button"
                                                onClick={capturarFoto}
                                                className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-sm flex items-center justify-center gap-2"
                                            >
                                                <Camera size={14} />
                                                Capturar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={detenerCamara}
                                                className="w-full py-2 bg-transparent text-gray-500 border border-white/10 rounded-lg hover:bg-white/5 transition text-sm"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {empleadoEditando?.face_id && (
                                                <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                                                    <p className="text-blue-400 text-xs leading-relaxed">
                                                        Rostro ya registrado. Activa la cámara solo si deseas reemplazarlo.
                                                    </p>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={activarCamara}
                                                className="w-full border border-dashed border-blue-400/20 rounded-lg hover:border-blue-500/50 text-gray-500 hover:text-blue-400 transition flex flex-col items-center justify-center gap-3 bg-[#1a1d27]"
                                                style={{ aspectRatio: '4/3' }}
                                            >
                                                <Camera size={28} className="opacity-40" />
                                                <span className="text-xs text-center px-2">Activar cámara</span>
                                            </button>
                                        </div>
                                    )}

                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-7 pb-6 pt-4 border-t border-blue-400/10 flex gap-3">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    className="flex-1 py-2.5 bg-transparent border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/5 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="flex-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {guardando ? 'Guardando...' : 'Guardar empleado'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
