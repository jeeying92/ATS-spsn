export type Locale = "en" | "zh";

export const translations = {
  en: {
    // Header
    careers: "Careers",
    viewOpenings: "View Openings",

    // Hero
    heroTitle1: "Build Your Career",
    heroTitle2: "With Us",
    heroDesc:
      "Join Semipack Malaysia Sdn Bhd and be part of a world-class semiconductor packaging company. Discover opportunities that match your talent.",
    viewOpeningsBtn: "View Openings",
    learnMore: "Learn More",

    // Stats
    headquarters: "Headquarters",
    industry: "Industry",
    semiconductor: "Semiconductor",
    openPositions: "Open Positions",
    qualityStandard: "Quality Standard",
    isoCertified: "ISO Certified",

    // Why section
    whySemipack: "Why Semipack Malaysia",
    exploreEngageExcel: "Explore, Engage & Excel",
    ourVision: "Our Vision",
    ourMission: "Our Mission",

    // Jobs
    opportunities: "Opportunities",
    currentOpenings: "Current Openings",
    searchPositions: "Search positions...",
    allDepartments: "All Departments",
    noPositions: "No open positions found.",
    tryAdjusting: "Try adjusting your filters or check back later.",
    viewDetails: "View Details",
    fullTime: "Full Time",
    partTime: "Part Time",
    contract: "Contract",

    // Job detail
    backToOpenings: "Back to all openings",
    aboutRole: "About the Role",
    requirements: "Requirements",
    benefits: "Benefits",
    applyNow: "Apply Now",
    applyFormDesc: "Fill in the form below to submit your application.",
    submitApplication: "Submit Application",

    // Apply form
    fullName: "Full Name",
    emailAddress: "Email Address",
    phoneNumber: "Phone Number",
    resume: "Resume (PDF, max 5MB)",
    coverLetter: "Cover Letter",
    coverLetterPlaceholder: "Tell us why you're interested in this role...",
    applicationSubmitted: "Application Submitted!",
    applicationConfirm:
      "Thank you for applying. We will review your application and contact you within 5-7 business days.",

    // CTA
    discoverPotential: "Discover Your Potential",
    ctaSubtitle: "Your Career. Your Journey. Start Here.",

    // Footer
    allRightsReserved: "All rights reserved.",

    // Location
    location: "Location",
  },
  zh: {
    // Header
    careers: "职业机会",
    viewOpenings: "查看职位",

    // Hero
    heroTitle1: "开启您的职业生涯",
    heroTitle2: "加入我们",
    heroDesc:
      "加入 Semipack Malaysia Sdn Bhd，成为世界一流半导体封装公司的一员。发掘与您才华匹配的机会。",
    viewOpeningsBtn: "查看职位",
    learnMore: "了解更多",

    // Stats
    headquarters: "总部",
    industry: "行业",
    semiconductor: "半导体",
    openPositions: "开放职位",
    qualityStandard: "质量标准",
    isoCertified: "ISO 认证",

    // Why section
    whySemipack: "为什么选择 Semipack Malaysia",
    exploreEngageExcel: "探索、参与、卓越",
    ourVision: "我们的愿景",
    ourMission: "我们的使命",

    // Jobs
    opportunities: "职位机会",
    currentOpenings: "当前开放职位",
    searchPositions: "搜索职位...",
    allDepartments: "所有部门",
    noPositions: "未找到开放职位。",
    tryAdjusting: "请调整筛选条件或稍后再查看。",
    viewDetails: "查看详情",
    fullTime: "全职",
    partTime: "兼职",
    contract: "合同制",

    // Job detail
    backToOpenings: "返回所有职位",
    aboutRole: "职位介绍",
    requirements: "任职要求",
    benefits: "福利待遇",
    applyNow: "立即申请",
    applyFormDesc: "请填写以下表格提交您的申请。",
    submitApplication: "提交申请",

    // Apply form
    fullName: "姓名",
    emailAddress: "电子邮箱",
    phoneNumber: "联系电话",
    resume: "简历（PDF，最大 5MB）",
    coverLetter: "求职信",
    coverLetterPlaceholder: "请告诉我们您为何对这个职位感兴趣...",
    applicationSubmitted: "申请已提交！",
    applicationConfirm:
      "感谢您的申请。我们将在 5-7 个工作日内审核您的申请并与您联系。",

    // CTA
    discoverPotential: "发掘您的潜力",
    ctaSubtitle: "您的事业。您的旅程。从这里开始。",

    // Footer
    allRightsReserved: "版权所有。",

    // Location
    location: "地址",
  },
} as const;

export function t(locale: Locale, key: keyof typeof translations.en): string {
  return translations[locale][key];
}
