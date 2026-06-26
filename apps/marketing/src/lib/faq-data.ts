import type { FaqItem } from "@/components/FaqAccordion";

export const faqItems: FaqItem[] = [
  {
    question: "How are O-Level and A-Level handled in the same system?",
    answer:
      "O-Level (S1 to S4) and A-Level (S5 to S6) use separate assessment flows aligned to their curricula. O-Level follows CBC: competency ratings (A to E), project work for continuous assessment, end-of-cycle exams, and Result 1/2/3 certification. A-Level follows UNEB conventions: numerical scores convert to grades, points, and divisions. Both share the same student records, academic structure, and reporting tools.",
  },
  {
    question: "Does SchoolManage work on slow connections or 3G?",
    answer:
      "SchoolManage is a web application. You need an internet connection to sign in and save data. The interface is lightweight for typical school-day use on desktop or mobile browsers. It is not an offline-first app. We recommend a stable connection, including 3G or better, for assessment entry and report generation.",
  },
  {
    question: "How is our school data kept secure?",
    answer:
      "Each school operates in its own isolated tenant. Staff sign in with email and password. The API uses JWT authentication with role-based access so users only reach features allowed for their role. In production, data is protected with PostgreSQL row-level security, encrypted connections, session timeouts, and audit logging. School data is never mixed between tenants.",
  },
  {
    question: "Can we record mobile money fee payments?",
    answer:
      "Yes. The bursar can record payments by cash or mobile money and enter the mobile money transaction reference. Invoices, balances, and financial reports are kept in Ugandan shillings (UGX). Automated payment gateway integration is not part of the current release. Payments are recorded manually after you receive them.",
  },
  {
    question: "Can one organisation manage multiple schools?",
    answer:
      "Yes. SchoolManage supports multi-tenant architecture: each school gets its own subdomain and isolated data. A platform administrator can provision new schools, toggle modules per school (fees, exams, A-Level, attendance, analytics, and more), and manage tenants centrally. Custom domains and advanced production operations are on the roadmap.",
  },
  {
    question: "How is data backed up?",
    answer:
      "Your hosting environment should include regular database backups. The system supports standard PostgreSQL backup and restore workflows for operators. Per-tenant export tooling for production is planned. We recommend agreeing a backup schedule with your IT contact or hosting provider before go-live.",
  },
  {
    question: "Do you provide training and onboarding?",
    answer:
      "New schools go through a guided setup for academic years, classes, subjects, and grading scales. We provide onboarding support to help administrators configure CBC and UNEB rules correctly. Training scope and format depend on your plan. Contact us to discuss what your staff need.",
  },
  {
    question: "How do we get support?",
    answer:
      "Reach us through the contact form on this site or by email. For schools already using the product, your administrator can escalate issues through the channels agreed at onboarding. We aim to respond to setup and billing questions promptly during business hours.",
  },
  {
    question: "Are SMS notifications to parents available?",
    answer:
      "Not yet. SMS notifications for fees, attendance, or report cards are on the product roadmap and are not live in the current release. Schools should continue using their existing communication channels until this feature ships.",
  },
  {
    question: "Is there a parent portal?",
    answer:
      "A parent portal for viewing fees, attendance, and report cards is planned but not available yet. Parents cannot sign in today. We will announce it when it is ready for schools to use.",
  },
];
