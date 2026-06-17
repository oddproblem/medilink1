
import React, { useState, useMemo } from "react";
import { useLang } from "../../context/LangContext";

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const StethoscopeIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M16.5 13.125V6.375C16.5 4.347 14.903 2.75 13 2.75h-2c-1.903 0-3.5 1.597-3.5 3.625v6.75M9.5 13.125c0 .98-.625 1.75-1.5 1.75s-1.5-.77-1.5-1.75v-2.5c0-.98.625-1.75 1.5-1.75s1.5.77 1.5 1.75v2.5z"></path>
    <path d="M14.5 13.125c0 .98.625 1.75 1.5 1.75s1.5-.77 1.5-1.75v-2.5c0-.98-.625-1.75-1.5-1.75s-1.5.77-1.5 1.75v2.5z"></path>
    <path d="M5 13.5v5.5a2 2 0 002 2h10a2 2 0 002-2v-5.5"></path>
    <circle cx="12" cy="19" r="4"></circle>
  </svg>
);

const ALL_SYMPTOMS = [
  // unchanged list, keep as keys for translations
  "itching",
  "skin_rash",
  "nodal_skin_eruptions",
  "continuous_sneezing",
  "shivering",
  "chills",
  "joint_pain",
  "stomach_pain",
  "acidity",
  "ulcers_on_tongue",
  "muscle_wasting",
  "vomiting",
  "burning_micturition",
  "spotting_ urination",
  "fatigue",
  "weight_gain",
  "anxiety",
  "cold_hands_and_feets",
  "mood_swings",
  "weight_loss",
  "restlessness",
  "lethargy",
  "patches_in_throat",
  "irregular_sugar_level",
  "cough",
  "high_fever",
  "sunken_eyes",
  "breathlessness",
  "sweating",
  "dehydration",
  "indigestion",
  "headache",
  "yellowish_skin",
  "dark_urine",
  "nausea",
  "loss_of_appetite",
  "pain_behind_the_eyes",
  "back_pain",
  "constipation",
  "abdominal_pain",
  "diarrhoea",
  "mild_fever",
  "yellow_urine",
  "yellowing_of_eyes",
  "acute_liver_failure",
  "fluid_overload",
  "swelling_of_stomach",
  "swelled_lymph_nodes",
  "malaise",
  "blurred_and_distorted_vision",
  "phlegm",
  "throat_irritation",
  "redness_of_eyes",
  "sinus_pressure",
  "runny_nose",
  "congestion",
  "chest_pain",
  "weakness_in_limbs",
  "fast_heart_rate",
  "pain_during_bowel_movements",
  "pain_in_anal_region",
  "bloody_stool",
  "irritation_in_anus",
  "neck_pain",
  "dizziness",
  "cramps",
  "bruising",
  "obesity",
  "swollen_legs",
  "swollen_blood_vessels",
  "puffy_face_and_eyes",
  "enlarged_thyroid",
  "brittle_nails",
  "swollen_extremeties",
  "excessive_hunger",
  "extra_marital_contacts",
  "drying_and_tingling_lips",
  "slurred_speech",
  "knee_pain",
  "hip_joint_pain",
  "muscle_weakness",
  "stiff_neck",
  "swelling_joints",
  "movement_stiffness",
  "spinning_movements",
  "loss_of_balance",
  "unsteadiness",
  "weakness_of_one_body_side",
  "loss_of_smell",
  "bladder_discomfort",
  "foul_smell_of urine",
  "continuous_feel_of_urine",
  "passage_of_gases",
  "internal_itching",
  "toxic_look_(typhos)",
  "depression",
  "irritability",
  "muscle_pain",
  "altered_sensorium",
  "red_spots_over_body",
  "belly_pain",
  "abnormal_menstruation",
  "dischromic _patches",
  "watering_from_eyes",
  "increased_appetite",
  "polyuria",
  "family_history",
  "mucoid_sputum",
  "rusty_sputum",
  "lack_of_concentration",
  "visual_disturbances",
  "receiving_blood_transfusion",
  "receiving_unsterile_injections",
  "coma",
  "stomach_bleeding",
  "distention_of_abdomen",
  "history_of_alcohol_consumption",
  "fluid_overload.1",
  "blood_in_sputum",
  "prominent_veins_on_calf",
  "palpitations",
  "painful_walking",
  "pus_filled_pimples",
  "blackheads",
  "scurring",
  "skin_peeling",
  "silver_like_ dusting",
  "small_dents_in_nails",
  "inflammatory_nails",
  "blister",
  "red_sore_around_nose",
  "yellow_crust_ooze",
];

function DiseaseSymptomPrediction() {
  const [selectedSymptoms, setSelectedSymptoms] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { t, language, translateText } = useLang(); // ✅ use translations and translateText

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(symptom)) {
        newSet.delete(symptom);
      } else {
        newSet.add(symptom);
      }
      return newSet;
    });
  };

  const handleClearAll = () => {
    setSelectedSymptoms(new Set());
  };

  const handlePredict = async () => {
    if (selectedSymptoms.size === 0) {
      setError(t("pleaseSelectSymptom"));
      return;
    }
    setIsLoading(true);
    setError("");
    setPrediction(null);

    const postUrl = "https://hmm183-disease-prediction-workers.hf.space/predict";

    try {
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Notice this matches the Pydantic model we built in FastAPI exactly
        body: JSON.stringify({ selected_symptoms: Array.from(selectedSymptoms) }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      // Just grab the JSON directly, no stream parsing needed!
      const data = await response.json();
      const rawPred = data.prediction;

      // Keep your translation logic
      const translated = await translateText(rawPred, language);
      setPrediction(translated[0] || rawPred);

    } catch (e) {
      setError(e.message);
      console.error("API call failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSymptoms = useMemo(
    () =>
      ALL_SYMPTOMS.filter((symptom) =>
        symptom
          .replace(/_/g, " ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ),
    [searchTerm]
  );

  return (
    <div className="font-mono text-gray-200 max-w-6xl mx-auto my-8 flex flex-col gap-8 px-4 pt-24">
      <header className="text-center border-b border-gray-700 pb-4">
        <h1 className="text-4xl font-bold text-cyan-400 drop-shadow-md animate-pulse">
          {t("bioSynth")}
        </h1>
        <p className="text-gray-400 mt-2">{t("selectSymptoms")}</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[50vh]">
        {/* Symptoms Panel */}
        <div className="col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-md px-4 py-2 mb-4">
            <SearchIcon className="text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder={t("searchSymptoms")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <div className="flex flex-wrap gap-2 overflow-y-auto pr-2">
            {filteredSymptoms.map((symptom) => (
              <button
                key={symptom}
                className={`px-4 py-1.5 rounded-full border text-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${selectedSymptoms.has(symptom)
                  ? "bg-cyan-400 text-black border-cyan-400 shadow-md"
                  : "bg-gray-100 dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:border-cyan-400 hover:text-cyan-400"
                  }`}
                onClick={() => handleSymptomToggle(symptom)}
              >
                {t(symptom)}
              </button>
            ))}
          </div>
        </div>

        {/* Selection Panel */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-lg flex flex-col">
          <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-3 mb-3">
            <h2 className="text-blue-500 font-semibold text-lg drop-shadow">
              {t("selected")} ({selectedSymptoms.size})
            </h2>
            {selectedSymptoms.size > 0 && (
              <button
                className="text-sm border border-gray-400 dark:border-gray-600 px-3 py-1 rounded-md text-gray-700 dark:text-gray-400 hover:text-blue-500 hover:border-blue-500 transition"
                onClick={handleClearAll}
              >
                {t("clearAll")}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto">
            {selectedSymptoms.size > 0 ? (
              Array.from(selectedSymptoms).map((symptom) => (
                <div
                  key={symptom}
                  className="flex justify-between items-center bg-gray-100 dark:bg-gray-950 px-3 py-2 rounded-md border-l-4 border-blue-500"
                >
                  <span className="capitalize text-gray-900 dark:text-gray-200">
                    {t(symptom)}
                  </span>
                  <button
                    onClick={() => handleSymptomToggle(symptom)}
                    className="text-lg text-gray-700 dark:text-gray-300 hover:text-blue-500 transition"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center mt-6">
                {t("chosenSymptoms")}
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="flex flex-col items-center gap-6">
        <button
          className="relative bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg px-10 py-3 font-semibold text-lg shadow-md hover:scale-105 hover:shadow-blue-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handlePredict}
          disabled={isLoading || selectedSymptoms.size === 0}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-b-transparent rounded-full animate-spin"></div>
          ) : (
            t("initiateDiagnosis")
          )}
        </button>

        <div className="flex justify-center w-full">
          {error && (
            <p className="text-red-400 bg-red-500/10 border border-red-500 px-4 py-2 rounded-md text-center max-w-lg">
              {error}
            </p>
          )}
          {prediction && !isLoading && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-lg text-center flex items-center gap-4 animate-fadeIn border-t-4 border-blue-400 shadow-lg">
              <StethoscopeIcon />
              <div className="text-left">
                <h3 className="text-blue-400 font-semibold text-lg mb-1">
                  {t("potentialDiagnosis")}
                </h3>
                <p className="text-2xl font-bold text-white capitalize">
                  {prediction}
                </p>
                <span className="text-xs text-gray-400 mt-2 block">
                  {t("disclaimer")}
                </span>
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default DiseaseSymptomPrediction;
