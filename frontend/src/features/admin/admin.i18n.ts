/** The admin panel's copy, in the three languages the app offers.
 *
 *  The sidebar and the header already picked by language (labelUz/labelRu/
 *  labelEn), so the panel was always meant to be multilingual — the screens
 *  behind them simply never got the same treatment and were written straight
 *  into the JSX in Uzbek. This is where their copy lives now.
 */
export const ADMIN_TEXTS = {
  uz: {
    // Overview
    escrowHeld: "Ish vaqtida xavfsiz saqlanayotgan mablag'",
    usersLabel: 'Foydalanuvchilar',
    totalPostings: "Jami E'lonlar",
    completedAndPaid: "Muvaffaqiyatli yakunlangan va to'langan",
    applicationsFromWorkers: 'Ishchilar tomonidan topshirilgan arizalar',

    // Users
    searchUsersPlaceholder: 'Ism, telefon yoki kompaniya...',
    phone: 'Telefon',
    noUsersFound: 'Foydalanuvchilar topilmadi',
    roleWorker: 'Ishchi',
    roleEmployer: 'Ish beruvchi',
    confirmRoleChange: "Rolni o'zgartirishni tasdiqlang",

    // Jobs
    searchJobsPlaceholder: 'Sarlavha, kompaniya yoki manzil...',
    cancelledOrRejected: 'Bekor qilindi / Rad etildi',
    rejectWithReason: 'Rad etish (Sabab bilan)',
    deletePosting: "E'lonni o'chirish",

    // Transactions
    financeTitle: 'Moliya va Pul Boshqaruvi',
    requestedDate: "So'ralgan sana",
    averageCommission: "O'rtacha Komissiya Stavkasi",

    // Settings
    settingsTitle: 'Platforma Sozlamalari va Boshqaruv',
    settingsSubtitle: 'Tizim parametrlari, admin rollari va audit jurnali',
    tabGeneral: 'Sozlamalar',
    tabAdmins: 'Admin Rollari',
    tabLogs: 'Audit Loglari',
    platformFeeLabel: 'Platforma Komissiyasi (%)',
    // The wage is the worker's in full; the commission is charged to the
    // employer on top of it. The old text here said the opposite.
    platformFeeHelp:
      "Ishchi e'londagi ish haqini to'liq oladi. Bu foiz ish beruvchidan ish haqi ustiga qo'shimcha olinadi. Yollash paytidagi foiz o'sha ish uchun saqlanadi.",
    minHourlyRate: 'Minimal Soatlik Ish Haqi (UZS)',
    autoApproveTitle: "E'lonlarni Avto-Tasdiqlash",
    autoApproveDesc: "Moderatsiyasiz darhol e'lonlar xaritada ko'rinadi",
    autoExpireTitle: "E'lonlarni Avto-O'chirish (Auto-Expiration)",
    autoExpireDesc: "14 kundan ortiq eskirgan e'lonlarni avto-o'chirish/arxivlash",
    autoDeleteSpamTitle: "Spam / Qoidabuzar E'lonlarni Avto-O'chirish",
    autoDeleteSpamDesc: "Shubhali so'zlar aniqlanganda avtomatik o'chirish",
    maintenanceTitle: 'Maintenance Rejimi',
    maintenanceDesc: "Yangi e'lon va to'lovlar vaqtincha to'xtatiladi",
  },
  ru: {
    escrowHeld: 'Средства, удерживаемые на время работы',
    usersLabel: 'Пользователи',
    totalPostings: 'Всего объявлений',
    completedAndPaid: 'Успешно завершено и оплачено',
    applicationsFromWorkers: 'Заявки, поданные работниками',

    searchUsersPlaceholder: 'Имя, телефон или компания...',
    phone: 'Телефон',
    noUsersFound: 'Пользователи не найдены',
    roleWorker: 'Работник',
    roleEmployer: 'Работодатель',
    confirmRoleChange: 'Подтвердите смену роли',

    searchJobsPlaceholder: 'Название, компания или адрес...',
    cancelledOrRejected: 'Отменено / Отклонено',
    rejectWithReason: 'Отклонить (с причиной)',
    deletePosting: 'Удалить объявление',

    financeTitle: 'Финансы и управление платежами',
    requestedDate: 'Дата запроса',
    averageCommission: 'Средняя ставка комиссии',

    settingsTitle: 'Настройки и управление платформой',
    settingsSubtitle: 'Системные параметры, роли администраторов и журнал аудита',
    tabGeneral: 'Настройки',
    tabAdmins: 'Роли администраторов',
    tabLogs: 'Журнал аудита',
    platformFeeLabel: 'Комиссия платформы (%)',
    platformFeeHelp:
      'Работник получает указанную в объявлении оплату полностью. Этот процент берётся с работодателя сверх оплаты. Процент на момент найма сохраняется за этой работой.',
    minHourlyRate: 'Минимальная почасовая оплата (UZS)',
    autoApproveTitle: 'Автоподтверждение объявлений',
    autoApproveDesc: 'Объявления появляются на карте сразу, без модерации',
    autoExpireTitle: 'Автоудаление объявлений (Auto-Expiration)',
    autoExpireDesc: 'Автоудаление/архивация объявлений старше 14 дней',
    autoDeleteSpamTitle: 'Автоудаление спама и объявлений с нарушениями',
    autoDeleteSpamDesc: 'Автоматическое удаление при обнаружении подозрительных слов',
    maintenanceTitle: 'Режим обслуживания',
    maintenanceDesc: 'Новые объявления и платежи временно приостановлены',
  },
  en: {
    escrowHeld: 'Funds held while the work is under way',
    usersLabel: 'Users',
    totalPostings: 'Postings in total',
    completedAndPaid: 'Completed and paid',
    applicationsFromWorkers: 'Applications sent by workers',

    searchUsersPlaceholder: 'Name, phone or company...',
    phone: 'Phone',
    noUsersFound: 'No users found',
    roleWorker: 'Worker',
    roleEmployer: 'Employer',
    confirmRoleChange: 'Confirm the role change',

    searchJobsPlaceholder: 'Title, company or address...',
    cancelledOrRejected: 'Cancelled / Rejected',
    rejectWithReason: 'Reject (with a reason)',
    deletePosting: 'Delete the posting',

    financeTitle: 'Finance and payments',
    requestedDate: 'Requested on',
    averageCommission: 'Average commission rate',

    settingsTitle: 'Platform settings and controls',
    settingsSubtitle: 'System parameters, admin roles and the audit log',
    tabGeneral: 'Settings',
    tabAdmins: 'Admin roles',
    tabLogs: 'Audit log',
    platformFeeLabel: 'Platform commission (%)',
    platformFeeHelp:
      'The worker receives the posted wage in full. This percentage is charged to the employer on top of it. The rate at the moment of hiring is kept for that job.',
    minHourlyRate: 'Minimum hourly rate (UZS)',
    autoApproveTitle: 'Auto-approve postings',
    autoApproveDesc: 'Postings appear on the map straight away, without moderation',
    autoExpireTitle: 'Auto-expire postings',
    autoExpireDesc: 'Auto-delete or archive postings older than 14 days',
    autoDeleteSpamTitle: 'Auto-delete spam and rule-breaking postings',
    autoDeleteSpamDesc: 'Delete automatically when suspicious words are found',
    maintenanceTitle: 'Maintenance mode',
    maintenanceDesc: 'New postings and payments are paused',
  },
} as const;
