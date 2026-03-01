export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    const result = await Notification.requestPermission();
    this.permission = result;
    return result === 'granted';
  }

  public notify(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Notifications not supported:', title, options);
      return;
    }

    if (this.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico', // Fallback icon
        ...options,
      });
    } else {
      console.log('Notification permission not granted. Content:', title, options);
      // Fallback: we could implement a toast system here
    }
  }

  public notifyStatusChange(type: 'VALIDACION' | 'LEGALIZACION', status: string, obraId: string) {
    const title = type === 'VALIDACION' ? 'Actualización de Validación' : 'Actualización de Legalización';
    let body = '';

    if (status === 'RECHAZADA_CON_DEFECTOS') {
      body = `La validación de la obra ${obraId} ha sido rechazada. Revisa los defectos indicados.`;
    } else if (status === 'SUBSANACION_REQUERIDA') {
      body = `Se requiere subsanación para la legalización de la obra ${obraId}.`;
    } else {
      body = `El estado de ${type.toLowerCase()} ha cambiado a ${status.replace(/_/g, ' ')}.`;
    }

    this.notify(title, {
      body,
      tag: `${type}-${obraId}`,
    });
  }
}

export const notificationService = NotificationService.getInstance();
