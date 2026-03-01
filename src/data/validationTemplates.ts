import { ValidationItemTemplate, TipoObra, Obra } from '../types/obra';

export const TEMPLATES_BASE: Record<TipoObra, ValidationItemTemplate[]> = {
  [TipoObra.FV_ESTANDAR]: [
    { 
      id: 'rev-tec-1', 
      label: 'Revisión Técnica', 
      description: 'Marca los checks completados', 
      required: true, 
      subtipo: 'FV_ESTANDAR', 
      type: 'CHECKLIST',
      checklistItems: [
        'Inversor arranca y produce',
        'Tension de string comprobadas',
        'Protecciones AC/DC revisadas',
        'Parámetros estándar AURO cargados',
        'Inversor conectado a internet',
        'Producción visible en plataforma',
        'App de cliente operativa en su movil',
        'Meter comunica con el inversor',
        'Sentido de medida correcto (CT bien orientado y cables en su lugar)'
      ]
    },
    { 
      id: 'foto-inv-sn', 
      label: 'Fotografía Inversor (SN)', 
      description: 'Donde se vea el modelo y número de serie', 
      required: true, 
      subtipo: 'INVERSOR', 
      type: 'PHOTO', 
      requiresOCR: true, 
      ocrType: 'INVERSOR' 
    },
    { 
      id: 'foto-inv-func', 
      label: 'Fotografía Inversor (Funcionando)', 
      description: 'Donde se vea que funciona (pantalla o leds)', 
      required: true, 
      subtipo: 'INVERSOR', 
      type: 'PHOTO' 
    },
    { 
      id: 'foto-mod-peg', 
      label: 'Fotografía Módulos (pegatina trasera)', 
      description: 'Ficha técnica trasera del módulo', 
      required: true, 
      subtipo: 'PLACAS', 
      type: 'PHOTO', 
      requiresOCR: true, 
      ocrType: 'PLACAS' 
    },
    { 
      id: 'num-mod-inst', 
      label: 'Número de módulos instalados', 
      required: true, 
      subtipo: 'PLACAS', 
      type: 'TEXT' 
    },
    { 
      id: 'foto-cuadros', 
      label: 'Fotografía cuadros eléctricos', 
      description: 'Incluye foto SIN tapadera y CON tapadera', 
      required: true, 
      subtipo: 'FV_ESTANDAR', 
      type: 'PHOTO' 
    },
    { 
      id: 'cal-inst', 
      label: 'Calidad de la instalación', 
      required: true, 
      subtipo: 'FV_ESTANDAR', 
      type: 'CHECKLIST',
      checklistItems: [
        'Grapeado de canalizaciones correcta',
        'Inversor rotulado',
        'Instalación limpia y sin residuos'
      ]
    },
    { 
      id: 'foto-inst-int', 
      label: 'Fotografía Instalación interior', 
      description: 'Conjunto de inversor y elementos interiores', 
      required: true, 
      subtipo: 'FV_ESTANDAR', 
      type: 'PHOTO' 
    },
    { 
      id: 'foto-vista-gral', 
      label: 'Vista general de la instalación', 
      description: 'Foto panorámica que abarque los equipos principales y la disposición general', 
      required: true, 
      subtipo: 'FV_ESTANDAR', 
      type: 'PHOTO' 
    },
    { 
      id: 'foto-pan-inst', 
      label: 'Fotografía Paneles Instalados', 
      description: 'Paneles y canalizaciones (vistas de paneles)', 
      required: true, 
      subtipo: 'PLACAS', 
      type: 'PHOTO' 
    },
    { 
      id: 'foto-can', 
      label: 'Fotografía de las canalizaciones', 
      description: 'Cableado y grapeado de fachada', 
      required: true, 
      subtipo: 'FV_ESTANDAR', 
      type: 'PHOTO' 
    },
    { 
      id: 'det-cli', 
      label: 'Detalles a explicar al cliente', 
      required: true, 
      subtipo: 'FV_ESTANDAR', 
      type: 'CHECKLIST',
      checklistItems: [
        'Funcionamiento básico explicado',
        'App explicada y probada con el cliente',
        'Datos de acceso entregados',
        'Cliente firma recepción conforme',
        'Cliente sabe donde y quien llamar en caso de incidencia',
        'Explicado a cliente que no debe hacer'
      ]
    },
    { 
      id: 'foto-app-cli', 
      label: 'Pantalla app del cliente', 
      description: 'Foto de la monitorización en el teléfono del cliente', 
      required: true, 
      subtipo: 'FV_ESTANDAR', 
      type: 'PHOTO' 
    }
  ],
  [TipoObra.FV_BATERIA]: [],
  [TipoObra.SAT_BATERIA]: [],
  [TipoObra.CLIMATIZACION]: [
    { 
      id: 'clim-1', 
      label: 'Puesta en Marcha Climatización', 
      required: true, 
      subtipo: 'OTROS', 
      type: 'CHECKLIST',
      checklistItems: [
        'Prueba de estanqueidad realizada',
        'Vacío del circuito completado',
        'Carga de refrigerante verificada',
        'Consumo eléctrico nominal comprobado',
        'Diferencial de temperatura entrada/salida OK',
        'Desagües probados y sin fugas',
        'Explicación de mando/termostato al cliente'
      ]
    },
    { 
      id: 'foto-equipo', 
      label: 'Foto Equipo Principal', 
      description: 'Unidad exterior e interior', 
      required: true, 
      subtipo: 'OTROS', 
      type: 'PHOTO' 
    }
  ],
  [TipoObra.AMPLIACION]: [
    { 
      id: 'amp-1', 
      label: 'Validación Ampliación', 
      required: true, 
      subtipo: 'FV_ESTANDAR', 
      type: 'CHECKLIST',
      checklistItems: [
        'Nuevas placas integradas en monitorización',
        'Inversor soporta la nueva potencia',
        'Estructura de ampliación nivelada',
        'Cableado de ampliación protegido'
      ]
    },
    { 
      id: 'foto-amp-gral', 
      label: 'Foto General Ampliación', 
      required: true, 
      subtipo: 'PLACAS', 
      type: 'PHOTO' 
    }
  ],
  [TipoObra.ALQUILER_CUBIERTA]: [
    { 
      id: 'alq-1', 
      label: 'Inspección de Cubierta', 
      required: true, 
      subtipo: 'OTROS', 
      type: 'CHECKLIST',
      checklistItems: [
        'Estado de la impermeabilización verificado',
        'Puntos de anclaje identificados',
        'Acceso para mantenimiento asegurado',
        'Medición de superficie útil realizada'
      ]
    },
    { 
      id: 'foto-cubierta', 
      label: 'Fotos Estado Cubierta', 
      required: true, 
      subtipo: 'OTROS', 
      type: 'PHOTO' 
    }
  ],
  [TipoObra.MANO_DE_OBRA]: [
    { 
      id: 'mo-1', 
      label: 'Parte de Trabajo (Mano de Obra)', 
      required: true, 
      subtipo: 'OTROS', 
      type: 'CHECKLIST',
      checklistItems: [
        'Tareas completadas según pedido',
        'Zona de trabajo limpia',
        'Firma de conformidad del responsable de la empresa cliente'
      ]
    },
    { 
      id: 'foto-mo-final', 
      label: 'Foto Resultado Trabajo', 
      required: true, 
      subtipo: 'OTROS', 
      type: 'PHOTO' 
    }
  ]
};

export const ADDONS_VALIDACION: Record<string, ValidationItemTemplate[]> = {
  BATERIA: [
    { 
      id: 'val-bat', 
      label: 'Validación Baterías', 
      required: true, 
      subtipo: 'BATERIA', 
      type: 'CHECKLIST',
      checklistItems: [
        'Batería comunica con el inversor',
        'SOC visible correctamente (% de batería)',
        'Carga y descarga verificados',
        'Bateria aparece en app del movil',
        'Sin errores en BMS',
        'Potencia carga y descarga configurada (tambien %)'
      ]
    },
    { 
      id: 'foto-bat-sn', 
      label: 'Fotografía de las baterías (SN)', 
      description: 'Todos los números de serie', 
      required: true, 
      subtipo: 'BATERIA', 
      type: 'PHOTO', 
      requiresOCR: true, 
      ocrType: 'BATERIA' 
    },
    { 
      id: 'foto-bat-func', 
      label: 'Fotografía de la batería funcionando', 
      required: true, 
      subtipo: 'BATERIA', 
      type: 'PHOTO' 
    }
  ],
  BACKUP: [
    { 
      id: 'val-bk', 
      label: 'Validación Backup', 
      required: true, 
      subtipo: 'BACKUP', 
      type: 'CHECKLIST',
      checklistItems: [
        'Batería comunica con inversor',
        'Simulado corte de red',
        'Inversor entra en modo backup',
        'Tensión presente en circuito de carga crítica',
        'Reconexión de red correcta'
      ]
    }
  ],
  INCIDENCIAS: [
    { 
      id: 'inc-det', 
      label: 'Detalles de Incidencia', 
      required: false, 
      subtipo: 'FV_ESTANDAR', 
      type: 'TEXT' 
    },
    { 
      id: 'inc-foto', 
      label: 'Fotos para incidencia', 
      required: false, 
      subtipo: 'FV_ESTANDAR', 
      type: 'PHOTO' 
    }
  ]
};

export function getTemplateForObra(obra: Obra): ValidationItemTemplate[] {
  let template = [...(TEMPLATES_BASE[obra.tipoObra] || TEMPLATES_BASE[TipoObra.FV_ESTANDAR])];
  
  if (obra.tipoObra === TipoObra.FV_BATERIA || obra.tieneBackup) {
    template = [...template, ...ADDONS_VALIDACION.BATERIA];
  }
  
  if (obra.tieneBackup) {
    template = [...template, ...ADDONS_VALIDACION.BACKUP];
  }

  template = [...template, ...ADDONS_VALIDACION.INCIDENCIAS];
  
  return template;
}
