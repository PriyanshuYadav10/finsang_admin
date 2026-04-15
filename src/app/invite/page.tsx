"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  Clock,
  User,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Download,
  ExternalLink,
} from "lucide-react";

interface InvitationData {
  leader_name: string;
  invited_by: string;
  status: "valid" | "expired" | "accepted";
  member_name: string;
  member_phone: string;
  member_email?: string;
  created_at: string;
  expires_at?: string;
  error?: string;
}

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [invitationData, setInvitationData] = useState<InvitationData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpeningApp, setIsOpeningApp] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link. No token found.");
      setLoading(false);
      return;
    }

    fetchInvitationDetails();
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      console.log("Fetching invitation details for token:", token);
      console.log("API URL:", `/api/invitation/${token}`);

      const response = await fetch(`/api/invitation/${token}`);
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const data = await response.json();
      console.log("API Response:", data);

      if (data.error) {
        console.log("Setting error:", data.error);
        setError(data.error);
        setInvitationData(data);
      } else {
        console.log("Setting invitation data:", data);
        setInvitationData(data);
      }
    } catch (error) {
      console.error("Error fetching invitation details:", error);
      setError("Failed to load invitation details");
    } finally {
      setLoading(false);
    }
  };

  const openApp = () => {
    if (!token) return;

    setIsOpeningApp(true);

    // Create deep link
    const deepLink = `finsangmart://accept-invitation?token=${token}`;

    console.log("Attempting to open app with deep link:", deepLink);

    // Try to open the app using multiple methods
    const tryOpenApp = () => {
      // Method 1: Direct window.location (works better for development)
      window.location.href = deepLink;

      // Method 2: Iframe fallback
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = deepLink;
      document.body.appendChild(iframe);

      // Method 3: Window.open
      window.open(deepLink, "_blank");
    };

    tryOpenApp();

    // Don't show fallback alert immediately - let the deep link work
    // Only show fallback if user comes back to the page
    setTimeout(() => {
      setIsOpeningApp(false);
      console.log("Deep link attempt completed");
    }, 2000);
  };

  const downloadApp = () => {
    // For development, show instructions instead of Play Store
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("172.24.132.187")
    ) {
      alert(
        'Development Mode: Please install the app using "npx expo run:android" in your FinsangMart project directory.'
      );
    } else {
      window.open(
        "https://play.google.com/store/apps/details?id=com.finsangmart.app",
        "_blank"
      );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "expired":
        return <Clock className="w-5 h-5 text-red-500" />;
      case "accepted":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "text-green-600 bg-green-50 border-green-200";
      case "expired":
        return "text-red-600 bg-red-50 border-red-200";
      case "accepted":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Invitation
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-2xl font-bold">F</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Team Invitation
            </h1>
            <p className="text-gray-600">
              You've been invited to join a FinsangMart team!
            </p>
          </div>

          {/* Invitation Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            {/* Debug Info */}
            <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
              <p>
                <strong>Token:</strong> {token}
              </p>
              <p>
                <strong>Loading:</strong> {loading ? "Yes" : "No"}
              </p>
              <p>
                <strong>Error:</strong> {error || "None"}
              </p>
              <p>
                <strong>Data:</strong>{" "}
                {invitationData ? "Loaded" : "Not loaded"}
              </p>
            </div>

            {/* Status Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium mb-4 ${getStatusColor(
                invitationData?.status || ""
              )}`}
            >
              {getStatusIcon(invitationData?.status || "")}
              {invitationData?.status === "valid" && "Valid Invitation"}
              {invitationData?.status === "expired" && "Expired"}
              {invitationData?.status === "accepted" && "Already Accepted"}
              {!invitationData?.status && "Unknown Status"}
            </div>

            {/* Invitation Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Team Leader</p>
                  <p className="font-semibold text-gray-900">
                    {invitationData?.leader_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Invited By</p>
                  <p className="font-semibold text-gray-900">
                    {invitationData?.invited_by}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Member Name</p>
                  <p className="font-semibold text-gray-900">
                    {invitationData?.member_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-semibold text-gray-900">
                    {invitationData?.member_phone}
                  </p>
                </div>
              </div>

              {invitationData?.member_email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">
                      {invitationData.member_email}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Invited On</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(invitationData?.created_at || "")}
                  </p>
                </div>
              </div>

              {invitationData?.expires_at && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Expires On</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(invitationData.expires_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {invitationData?.status === "valid" ? (
            <div className="space-y-3">
              <button
                onClick={openApp}
                disabled={isOpeningApp}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isOpeningApp ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Opening App...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-5 h-5" />
                    Open FinsangMart App
                  </>
                )}
              </button>

              {/* Manual Token Entry */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-600 mb-2">
                  Or manually enter this token in your app:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border font-mono text-sm">
                    {token}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(token || "")}
                    className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <button
                onClick={downloadApp}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download App
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {invitationData?.status === "expired" &&
                  "This invitation has expired. Please contact your team leader for a new invitation."}
                {invitationData?.status === "accepted" &&
                  "This invitation has already been accepted."}
              </p>
              <button
                onClick={downloadApp}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <Download className="w-5 h-5" />
                Download FinsangMart
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Having trouble? Contact support at{" "}
              <a
                href="mailto:support@finsang.in"
                className="text-blue-600 hover:underline"
              >
                support@finsang.in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
