import { Stethoscope, Building2, ShieldCheck, AlertCircle } from 'lucide-react';
import type { CoverageInfo } from '../lib/agent';

interface Props {
  cobertura: CoverageInfo;
}

// Tarjeta de resultado: especialidad sugerida, copago y hospitales en red
export default function CoverageCard({ cobertura }: Props) {
  const { especialidad, copago_porcentaje, requiere_referido, hospitales } = cobertura;

  const copagoLabel =
    copago_porcentaje === 0
      ? 'Sin copago'
      : `${copago_porcentaje}% de copago`;

  const copagoColor =
    copago_porcentaje === 0
      ? 'text-green-600'
      : copago_porcentaje <= 15
      ? 'text-primary'
      : copago_porcentaje <= 25
      ? 'text-amber-600'
      : 'text-red-500';

  return (
    <div className="w-full max-w-[90%] md:max-w-[80%] bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden">

      {/* Encabezado */}
      <div className="bg-primary-container px-4 py-3 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-on-primary-container" />
        <span className="text-sm font-semibold text-on-primary-container">Resumen de Cobertura</span>
      </div>

      <div className="p-4 flex flex-col gap-4">

        {/* Especialidad sugerida */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5 text-on-secondary-container" />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Especialidad sugerida</p>
            <p className="text-base font-bold text-on-surface">{especialidad}</p>
          </div>
        </div>

        {/* Copago */}
        <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-on-surface-variant">Tu copago estimado</span>
          <span className={`text-xl font-extrabold ${copagoColor}`}>{copagoLabel}</span>
        </div>

        {/* Requiere referido */}
        {requiere_referido && (
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium">Esta especialidad requiere referido médico previo.</span>
          </div>
        )}

        {/* Hospitales en red */}
        {hospitales.length > 0 && (
          <div>
            <p className="text-xs text-on-surface-variant font-medium mb-2 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Hospitales en red recomendados
            </p>
            <ul className="flex flex-col gap-1.5">
              {hospitales.map((h) => (
                <li
                  key={h}
                  className="text-sm font-medium text-on-surface bg-surface-container rounded-lg px-3 py-2"
                >
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
