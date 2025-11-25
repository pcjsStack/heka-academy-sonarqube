// Modal Manager to handle body class for multiple modals
class ModalManager {
  private static instance: ModalManager
  private modalCount = 0
  private readonly BODY_CLASS = 'modal-open'

  private constructor() {}

  public static getInstance(): ModalManager {
    if (!ModalManager.instance) {
      ModalManager.instance = new ModalManager()
    }
    return ModalManager.instance
  }

  public openModal(): void {
    this.modalCount++
    if (this.modalCount === 1) {
      document.body.classList.add(this.BODY_CLASS)
    }
  }

  public closeModal(): void {
    this.modalCount = Math.max(0, this.modalCount - 1)
    if (this.modalCount === 0) {
      document.body.classList.remove(this.BODY_CLASS)
    }
  }

  public getModalCount(): number {
    return this.modalCount
  }

  public forceCloseAll(): void {
    this.modalCount = 0
    document.body.classList.remove(this.BODY_CLASS)
  }
}

export const modalManager = ModalManager.getInstance()
