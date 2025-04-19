import { useState, useEffect } from "react";
import { FiUpload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BaseUrl } from "../configs/clientConfig";

export default function SnapPage() {
  const [image, setImage] = useState(null);
  const [imageDetails, setImageDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedLang, setSelectedLang] = useState("en-US");

  const navigate = useNavigate();

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    if (typeof window !== "undefined") {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
  }, []);

  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const matchingVoices = voices.filter((v) => v.lang === selectedLang);
      if (matchingVoices.length > 0) {
        utterance.voice = matchingVoices[0];
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const speakAllDetails = (imageDetails) => {
    const { category, description, drugInfo } = imageDetails;
    let fullText = `Category: ${category}. Description: ${description}.`;

    if (drugInfo) {
      if (drugInfo.generic_name) {
        fullText += ` Generic Name: ${drugInfo.generic_name}.`;
      }
      if (drugInfo.dosage_form) {
        fullText += ` Dosage Form: ${drugInfo.dosage_form}.`;
      }
      if (drugInfo.route?.length) {
        fullText += ` Route: ${drugInfo.route.join(", ")}.`;
      }
    }

    speakText(fullText);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(",")[1];
        setImage({ preview: URL.createObjectURL(file), base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !image.base64) {
      alert("Please upload an image.");
      return;
    }
  
    window.speechSynthesis.cancel();
    setLoading(true);
  
    try {
      // Step 1: Analyze image via ML API
      const response = await axios.post(
        "https://snap-med-ml.vercel.app/analyze-base64",
        { image: image.base64 }
      );
  
      console.log("Response from server:", response.data);
  
      const { lines, drugInfo: rawDrugInfo } = response.data;
  
      // ✅ Step 2: Make sure drugInfo is an object
      const drugInfo =
        rawDrugInfo && typeof rawDrugInfo === "object" && !Array.isArray(rawDrugInfo)
          ? rawDrugInfo
          : {};
  
      // Step 3: Set UI details
      const details = {
        category: drugInfo?.product_type || "Unknown",
        description: lines?.join(". ") || "No description available.",
        drugInfo,
      };
      setImageDetails(details);
      speakAllDetails(details);
  
      // Step 4: Send to backend
      await axios.post(
        "https://snap-med-back.vercel.app/api/history",
        {
          lines,
          drugInfo,
        },
        {
          withCredentials: true, // Include cookies for auth
        }
      );
  
      console.log("Successfully sent to history API.");
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
  
  
  

  const handleLogout = async () => {
    try {
      const resp = await axios.post(`${BaseUrl}/auth/logout`, { withCredentials: true });
      console.log("Logout response:", resp.data);
      navigate("/auth");
    } catch (error) {
        console.error("Error signing out:", error.response?.data || error.message);
    }
  };

  const languageLabels = {
    "en-US": "English",
    "bn-IN": "Bengali",
    "hi-IN": "Hindi",
    "es-ES": "Spanish",
    "fr-FR": "French",
    "de-DE": "German",
    "ja-JP": "Japanese",
    "zh-CN": "Chinese",
  };

  const availableLangs = [...new Set(voices.map((v) => v.lang))].filter((lang) =>
    Object.keys(languageLabels).includes(lang)
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white justify-center items-center px-6 md:px-12 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/3 left-1/4 w-[20rem] h-[20rem] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[16rem] h-[16rem] bg-cyan-500/25 rounded-full blur-[100px]" />
        <div className="absolute top-10 right-1/4 w-[14rem] h-[14rem] bg-indigo-500/20 rounded-full blur-[90px]" />
      </div>

      {/* Logo */}
      <div className="absolute top-8 w-full text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-wide">
          Snap<span className="text-blue-400">Med</span>
        </h1>
      </div>

      {/* Logout */}
      <div className="absolute top-6 right-6 md:top-8 md:right-12">
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm md:text-base bg-gradient-to-r from-gray-700 to-gray-900 hover:opacity-90 text-white rounded-xl shadow-md transition-all"
        >
          Logout
        </button>
      </div>

      {/* Main */}
      <div className="flex flex-col md:flex-row w-full max-w-7xl gap-8 md:gap-12 mt-[120px] md:mt-[130px] px-6 pb-12">
        {/* Upload */}
        <div className="w-full md:w-2/4 p-6 md:p-8 bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700 shadow-lg backdrop-blur-md rounded-2xl flex flex-col justify-between max-h-[calc(100vh-150px)]">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-6">
            Upload an Image
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6 flex-grow">
            <div className="flex flex-col items-center">
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center w-full py-4 bg-gray-800 border border-gray-700 rounded-lg text-white cursor-pointer hover:bg-gray-700 transition-all"
              >
                <FiUpload className="text-2xl mr-2" />
                <span>Choose Image</span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {image?.preview && (
                <img
                  src={image.preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg mt-6"
                />
              )}
              {loading ? (
                <div className="text-center text-gray-300 mt-6">
                  Analyzing image...
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-4 text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 rounded-lg text-lg transition-all mt-6"
                >
                  Analyze Image
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Details */}
        <div className="w-full md:w-3/4 p-6 md:p-8 bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700 shadow-lg backdrop-blur-md rounded-2xl flex flex-col justify-between max-h-[calc(100vh-150px)]">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-6">
            Image Details
          </h2>

          {/* Language selector */}
          <div className="mb-4 text-center">
            <label className="block mb-2 font-semibold">Select TTS Language</label>
            <select
              className="px-4 py-2 rounded-md text-black bg-white shadow focus:outline-none"
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
            >
              {availableLangs.map((lang) => (
                <option key={lang} value={lang}>
                  {languageLabels[lang] || lang}
                </option>
              ))}
            </select>
          </div>

          {imageDetails ? (
            <>
              <div className="bg-gray-800 p-6 rounded-lg text-gray-300 space-y-4 overflow-y-auto max-h-[400px]">
                {imageDetails.category && (
                  <p>
                    <strong>Category: </strong>
                    {imageDetails.category}
                  </p>
                )}
                {imageDetails.description && (
                  <p>
                    <strong>Description: </strong>
                    {imageDetails.description}
                  </p>
                )}
                {imageDetails.drugInfo?.generic_name && (
                  <p>
                    <strong>Generic Name: </strong>
                    {imageDetails.drugInfo.generic_name}
                  </p>
                )}
                {imageDetails.drugInfo?.dosage_form && (
                  <p>
                    <strong>Dosage Form: </strong>
                    {imageDetails.drugInfo.dosage_form}
                  </p>
                )}
                {imageDetails.drugInfo?.route?.length > 0 && (
                  <p>
                    <strong>Route: </strong>
                    {imageDetails.drugInfo.route.join(", ")}
                  </p>
                )}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => speakAllDetails(imageDetails)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg"
                >
                  🔁 Read Again
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400">
              Upload an image to see the details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}