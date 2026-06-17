import React from "react";
import { useLang } from "../../context/LangContext";

const DoctorModal = ({ show, onClose }) => {
  const { t } = useLang();

  if (!show) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1055] overflow-y-auto overflow-x-hidden outline-none flex items-center justify-center bg-gray-900 bg-opacity-50"
      aria-hidden="true"
    >
      <div className="modal-dialog-centered relative w-auto pointer-events-none max-w-lg my-8 mx-auto px-4 sm:px-0">
        <div className="modal-content relative flex flex-col w-full pointer-events-auto bg-white border border-gray-300 rounded-lg">
          <div className="modal-header flex items-start justify-between p-4 border-b border-gray-300 rounded-t">
            <h5 className="modal-title text-xl font-bold flex items-center">
              <i className="bi bi-person-vcard mr-2 text-blue-600" />
              {t("doctorLoginTitle", "Doctor / Health Worker Login")}
            </h5>
            <button
              type="button"
              className="btn-close text-gray-600 hover:text-gray-900"
              onClick={onClose}
              aria-label={t("close", "Close")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="modal-body p-4">
            <form>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">{t("email", "Email Address")}</label>
                <input
                  type="email"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder={t("emailPlaceholder", "name@example.com")}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">{t("password", "Password")}</label>
                <input
                  type="password"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder={t("passwordPlaceholder", "••••••••")}
                />
              </div>
              <div className="flex items-center justify-between mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox text-blue-600 h-5 w-5"
                    id="rememberD"
                  />
                  <span className="ml-2 text-gray-700 text-sm">{t("rememberMe", "Remember me")}</span>
                </label>
              </div>
              <button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {t("signIn", "Sign in")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorModal;