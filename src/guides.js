// guides.js
import StatsSection from './components/common/StatsSection.jsx';

// All 'content' fields are now translation keys (strings without the t() wrapper)
export const guides = {
    //paitent dashboard guide steps
    patient: [
        {
            target: ".dashboard-btn",
            content: "guide_patient_dashboard_btn",
        },
        {
            target: ".stat-chart",
            content: "guide_patient_stat_chart",
        },
        {
            target: ".prescription-list",
            content: "guide_patient_prescription_list",
        },
        {
            target: ".appointments-list",
            content: "guide_patient_appointments_list",
        },
        {
            target: ".medication-current",
            content: "guide_patient_medication_current",
        },
        {
            target: ".past-medication",
            content: "guide_patient_past_medication"
        },
        {
            target: ".disease-history",
            content: "guide_patient_disease_history"
        },
        {
            target: ".edit-note-btn",
            content: "guide_patient_edit_note",
        },
        {
            target: ".delete-note-btn",
            content: "guide_patient_delete_note",
        },
        {
            target: ".regenerate-summary-btn",
            content: "guide_patient_regenerate_summary"
        }
    ],

    //doctor dashboard guide steps
    doctor: [
        {
            target: ".dashboard-btn",
            content: "guide_doctor_dashboard_btn",
        },
        {
            target: ".search-patient",
            content: "guide_doctor_search_patient",
        },
        {
            target: ".appointment-list",
            content: "guide_doctor_appointment_list",
        },
        {
            target: ".patient-unde-treatment",
            content: "guide_doctor_patient_under_treatment",
        },
    ],

    public: [
        {
            target: ".lng-btn",
            content: "guide_public_language_btn",
        },
        {
            target: ".landing-signin-btn",
            content: "guide_public_signin_btn",
        },
        {
            target: ".landing-doctor-btn",
            content: "guide_public_doctor_btn",
        },
        {
            target: ".landing-services-btn",
            content: "guide_public_services_btn",
        },
        {
            target: ".landing-emergency-btn",
            content: "guide_public_emergency_btn",
        },
        {
            target: ".stats-btn",
            content: "guide_public_stats_btn",
        }
    ],
    patientAuth: [
        {
            target: ".pat-auth-card",
            content: "guide_auth_form",
            waitFor: ".pat-auth-card",
        },
        {
            target: ".kyc-reg",
            content: "guide_auth_kyc_reg",
        },
        {
            target: ".login input#uid",
            content: "guide_auth_login_uid",
        },
        {
            target: ".login input#name",
            content: "guide_auth_login_name",
        },
        {
            target: ".login input#password",
            content: "guide_auth_login_password",
        },
        {
            target: ".login button[type='submit']",
            content: "guide_auth_login_submit",
        },

    ],

    doctorAuth: [
        {
            target: ".doc-auth-card",
            content: "guide_doctor_auth_form",
            waitFor: ".doctor-login-form",
        },
        {
            target: ".new-reg",
            content: "guide_doctor_auth_new_reg",
            waitFor: ".new-reg",
        },
        {
            target: ".doctor-login-form #email",
            content: "guide_doctor_auth_email",
            waitFor: ".doctor-login-form #email",
        },
        {
            target: ".doctor-login-form #pass",
            content: "guide_doctor_auth_password",
            waitFor: ".doctor-login-form #pass",
        },
        {
            target: ".doctor-login-form #submit-btn",
            content: "guide_doctor_auth_submit",
            waitFor: ".doctor-login-form #submit-btn",
        },

    ],
    doctorVerifyGuide: [
        {
            target: ".doctor-registration #nmc-id",
            content: "guide_doctor_verify_nmc_id",
            waitFor: ".doctor-registration #nmc-id"
        },
        {
            target: ".doctor-registration #license",
            content: "guide_doctor_verify_license",
            waitFor: ".doctor-registration #license"
        },
        {
            target: ".doctor-registration #verify-btn",
            content: "guide_doctor_verify_button",
            waitFor: ".doctor-registration #verify-btn"
        },
        {
            target: ".sign-up-btn",
            content: "guide_doctor_verify_signup_btn",
        },
    ],
};