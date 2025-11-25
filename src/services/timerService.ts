import axiosInstance, { timerPrefix } from '@/services/api/axiosInstance'
import { t } from '@/utils/i18n'

class TimerService {
  async getTimer(timerId: number) {
    const response = await axiosInstance.get(`${timerPrefix}/${timerId}`, {
      loadingMessage: t('types.loading.fetchingTimer'),
      showLoader: false,
    })
    return response.data
  }
  async createTimer() {
    const response = await axiosInstance.post(
      `${timerPrefix}/create`,
      {},
      {
        loadingMessage: t('types.loading.creatingTimer'),
        showLoader: false,
      },
    )
    return response.data
  }
  async startTimer(timerId: number) {
    const response = await axiosInstance.post(
      `${timerPrefix}/${timerId}/start`,
      {},
      {
        loadingMessage: t('types.loading.startingTimer'),
        showLoader: false,
      },
    )
    return response.data
  }
  async stopTimer(timerId: number) {
    const response = await axiosInstance.post(
      `${timerPrefix}/${timerId}/stop`,
      {},
      {
        loadingMessage: t('types.loading.stoppingTimer'),
        showLoader: false,
      },
    )
    return response.data
  }

  // Special method for stopping timer during page unload
  // Uses fetch with keepalive to ensure request completes even after page closes
  stopTimerOnUnload(timerId: number) {
    const authToken = localStorage.getItem('auth_token')

    if (!authToken) {
      console.error('No auth token found for timer stop on unload')
      return
    }

    const timerBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const stopUrl = `${timerBaseUrl}common/chronometers/${timerId}/stop`

    // Use fetch with keepalive - browser guarantees delivery even after page closes
    fetch(stopUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({}),
      keepalive: true, // Critical: allows request to complete after page unload
    }).catch((error) => {
      console.error('Error stopping timer on unload:', error)
    })
  }
}

export default new TimerService()
