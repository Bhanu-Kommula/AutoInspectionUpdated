import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Alert,
  ProgressBar,
  Badge,
  Card,
} from "react-bootstrap";
import {
  FaUpload,
  FaClipboardCheck,
  FaComments,
  FaCheckCircle,
  FaFileAlt,
  FaImage,
  FaVideo,
  FaMicrophone,
  FaTrash,
  FaCar,
  FaEye,
  FaEdit,
  FaDollarSign,
} from "react-icons/fa";
import { toast } from "react-toastify";
import FileUploadService from "../utils/fileUploadService";
import { API_CONFIG } from "../api";
import "./InspectionInterface.css";

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const InspectionInterface = ({
  show,
  onHide,
  post,
  onComplete,
  initialTab = "files",
  viewMode = false, // New prop for view mode
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [checklistData, setChecklistData] = useState({});
  const [finalRemarks, setFinalRemarks] = useState("");
  const [completing, setCompleting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(viewMode); // State for view/edit mode
  const [showCompletionConfirmModal, setShowCompletionConfirmModal] =
    useState(false); // State for completion confirmation modal

  // Add refs for request cancellation and debouncing
  const pendingRequests = useRef(new Map()); // Track pending API requests
  const debouncedSaves = useRef(new Map()); // Track debounced save functions
  const lastSavedValues = useRef(new Map()); // Track last saved values to prevent duplicate saves

  // Update isViewMode when viewMode prop changes
  useEffect(() => {
    // Check if force edit mode is requested (for completion modal)
    if (post?.forceEditMode) {
      setIsViewMode(false);
      console.log("🔧 Force edit mode enabled for completion review");
      return;
    }

    // For in-progress inspections, always allow editing even if submitted
    const isInProgress =
      post?.status === "INPROGRESS" ||
      post?.status === "inprogress" ||
      post?.status === "IN_PROGRESS" ||
      post?.status === "in_progress";

    // Only force view mode for truly completed reports (not just submitted)
    const isCompleted =
      post?.status === "COMPLETED" || post?.status === "completed";

    if (isCompleted) {
      setIsViewMode(true);
      console.log(
        "🔒 Forcing view mode for completed report, status:",
        post?.status
      );
    } else if (isInProgress) {
      // Allow editing for in-progress inspections (including submitted ones)
      setIsViewMode(false);
      console.log(
        "✏️ Allowing edit mode for in-progress inspection, status:",
        post?.status
      );
    } else {
      setIsViewMode(viewMode);
      console.log("🔍 ViewMode prop changed to:", viewMode);
    }
  }, [viewMode, post?.status, post?.forceEditMode]);
  const [activeAccordionKey, setActiveAccordionKey] = useState("0"); // Track active accordion section
  const [completedSections, setCompletedSections] = useState(new Set()); // Track completed sections

  // Cache for checklist items to avoid repeated API calls
  const [checklistItemsCache, setChecklistItemsCache] = useState(null);
  const [savingStates, setSavingStates] = useState({});
  const [anySaving, setAnySaving] = useState(false); // Track if any save operation is in progress

  // Cleanup function to cancel pending requests
  const cancelPendingRequests = useCallback(() => {
    pendingRequests.current.forEach((controller) => {
      controller.abort();
    });
    pendingRequests.current.clear();
  }, []);

  // Cleanup on unmount or post change
  useEffect(() => {
    return () => {
      cancelPendingRequests();
      // Clear all tracking data
      pendingRequests.current.clear();
      debouncedSaves.current.clear();
      lastSavedValues.current.clear();
    };
  }, [cancelPendingRequests, post?.id]); // Re-run when post ID changes

  // Load checklist items once and cache them
  const loadChecklistItems = useCallback(async (reportId) => {
    try {
      console.log("🔄 Loading checklist items for report:", reportId);
      const response = await fetch(
        `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}/checklist`
      );
      const data = await response.json();

      if (data.success && data.checklist) {
        setChecklistItemsCache(data.checklist);
        console.log("✅ Cached", data.checklist.length, "checklist items");
        return data.checklist;
      } else {
        console.error("❌ Failed to load checklist items:", data);
        return null;
      }
    } catch (error) {
      console.error("❌ Error loading checklist items:", error);
      return null;
    }
  }, []);

  // Load inspection report data including remarks
  const loadInspectionReport = useCallback(async (reportId) => {
    try {
      console.log("🔄 Loading inspection report data for report:", reportId);
      const response = await fetch(
        `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}`
      );
      const data = await response.json();

      if (data.success && data.report) {
        console.log("✅ Loaded inspection report:", data.report);

        // Load final remarks if available
        if (data.report.generalNotes) {
          setFinalRemarks(data.report.generalNotes);
          console.log("✅ Loaded final remarks:", data.report.generalNotes);
        }

        return data.report;
      } else {
        console.error("❌ Failed to load inspection report:", data);
        return null;
      }
    } catch (error) {
      console.error("❌ Error loading inspection report:", error);
      return null;
    }
  }, []);

  // Load uploaded files for the report
  const loadUploadedFiles = useCallback(async (reportId) => {
    try {
      console.log("🔄 Loading uploaded files for report:", reportId);
      const response = await fetch(
        `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}/files`
      );
      const data = await response.json();

      if (data.success && data.files) {
        setUploadedFiles(data.files);
        console.log("✅ Loaded", data.files.length, "uploaded files");
        return data.files;
      } else {
        console.error("❌ Failed to load uploaded files:", data);
        return [];
      }
    } catch (error) {
      console.error("❌ Error loading uploaded files:", error);
      return [];
    }
  }, []);

  // Generate unique key for localStorage based on post ID
  const getStorageKey = (postId) => `inspection_draft_${postId}`;

  // Auto-save function
  const saveDraft = (postId, data) => {
    try {
      const draftData = {
        checklistData: data.checklistData,
        finalRemarks: data.finalRemarks,
        uploadedFiles: data.uploadedFiles,
        lastSaved: new Date().toISOString(),
        postId: postId,
      };
      localStorage.setItem(getStorageKey(postId), JSON.stringify(draftData));
      console.log("Draft saved for post:", postId);
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  const [draftLoaded, setDraftLoaded] = useState(false);

  // Load draft function
  const loadDraft = (postId) => {
    try {
      const savedDraft = localStorage.getItem(getStorageKey(postId));
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        if (draftData.postId === postId) {
          setChecklistData(draftData.checklistData || {});
          setFinalRemarks(draftData.finalRemarks || "");
          setUploadedFiles(draftData.uploadedFiles || []);
          setDraftLoaded(true);
          console.log("Draft loaded for post:", postId);
          return true;
        }
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
    return false;
  };

  // Clear draft function
  const clearDraft = (postId) => {
    try {
      localStorage.removeItem(getStorageKey(postId));
      console.log("Draft cleared for post:", postId);
    } catch (error) {
      console.error("Error clearing draft:", error);
    }
  };

  // Inspection categories with car terminology
  const inspectionCategories = {
    EXTERIOR: {
      title: "🚗 Exterior Body & Paint",
      items: [
        "Body panels and paint condition",
        "Windows and windshield condition",
        "Headlights, taillights, and turn signals",
        "Tires, wheels, and wheel alignment",
        "Side mirrors and visibility",
        "Doors, handles, and locks",
        "Hood and trunk operation",
        "Bumpers, grille, and trim",
      ],
    },
    INTERIOR: {
      title: "🪑 Interior & Cabin",
      items: [
        "Seats, upholstery, and comfort",
        "Dashboard, gauges, and controls",
        "Air conditioning and heating system",
        "Radio, infotainment, and connectivity",
        "Instrument cluster and warning lights",
        "Steering wheel and steering column",
        "Carpets, floor mats, and cleanliness",
        "Interior lighting and accessories",
      ],
    },
    ENGINE: {
      title: "⚙️ Engine & Performance",
      items: [
        "Engine oil level and quality",
        "Coolant level and radiator condition",
        "Battery, terminals, and charging system",
        "Drive belts and cooling hoses",
        "Air filter and intake system",
        "Engine mounts and vibration",
        "Exhaust system and emissions",
        "Engine performance and idle",
      ],
    },
    TRANSMISSION: {
      title: "🔧 Transmission & Drivetrain",
      items: [
        "Transmission fluid level and color",
        "Gear shifting operation (manual/automatic)",
        "Clutch operation and engagement",
        "Transmission mounts and support",
        "Driveshaft and CV joints",
        "Differential and axle condition",
      ],
    },
    BRAKES: {
      title: "🛑 Braking System",
      items: [
        "Brake pads thickness and wear",
        "Brake rotors and disc condition",
        "Brake lines, hoses, and connections",
        "Brake fluid level and quality",
        "Parking brake adjustment and operation",
        "ABS system and brake assist",
      ],
    },
    SUSPENSION: {
      title: "🏎️ Suspension & Steering",
      items: [
        "Shock absorbers and dampers",
        "Springs, struts, and coil springs",
        "Control arms and suspension bushings",
        "Ball joints and tie rod ends",
        "Steering components and alignment",
        "Wheel bearings and hub assembly",
      ],
    },
    ELECTRICAL: {
      title: "⚡ Electrical System",
      items: [
        "Alternator and charging system",
        "Starter motor and ignition system",
        "Wiring harnesses and connections",
        "Fuses, relays, and electrical panels",
        "Engine control unit (ECU) and sensors",
        "Power accessories and electronics",
      ],
    },
    SAFETY: {
      title: "🛡️ Safety Features",
      items: [
        "Seat belts and restraint systems",
        "Airbag system and SRS warning",
        "Child safety locks and LATCH system",
        "Emergency brake and hazard lights",
        "Safety warning systems and alerts",
        "Security system and anti-theft",
      ],
    },
    UNDERCARRIAGE: {
      title: "🔍 Undercarriage Inspection",
      items: [
        "Frame, chassis, and structural integrity",
        "Fuel tank, lines, and vapor system",
        "Steering rack and power steering",
        "Exhaust system and catalytic converter",
        "Heat shields and protective covers",
        "Undercarriage protection and skid plates",
      ],
    },
    TEST_DRIVE: {
      title: "🚙 Road Test & Performance",
      items: [
        "Engine acceleration and power delivery",
        "Braking performance and stopping distance",
        "Steering response and handling",
        "Suspension comfort and road feel",
        "Unusual noises, vibrations, or odors",
        "Transmission shifting and operation",
      ],
    },
  };

  // Dealership Multi-Point Inspection Categories
  // Frontend displays user-friendly labels but sends backend enum values
  // Updated to match database schema values
  const inspectionConditions = [
    { key: "EXCELLENT", label: "Like New", color: "success" },
    { key: "GOOD", label: "Serviceable", color: "primary" },
    { key: "FAIR", label: "Marginal", color: "warning" },
    { key: "POOR", label: "Requires Repair", color: "danger" },
    { key: "FAILED", label: "Not Accessible", color: "secondary" },
  ];

  const loadExistingFiles = useCallback(async () => {
    try {
      const reportId = post?.inspectionReportId;

      if (reportId) {
        const files = await FileUploadService.getFiles(reportId);
        setUploadedFiles(files);
        console.log("Loaded existing files:", files);
      }
    } catch (error) {
      console.error("Error loading existing files:", error);
      // Don't show error toast as this might be expected for new inspections
    }
  }, [post?.inspectionReportId]);

  // Load complete report data from database for view mode
  const loadCompleteReportData = useCallback(async () => {
    try {
      const postId = post?.id;

      if (!postId) {
        console.error("No post ID available for loading report data");
        return;
      }

      console.log("🔍 Loading report data for post ID:", postId);

      let reportId = post?.inspectionReportId; // Declare reportId variable

      // Get the complete report by post ID
      try {
        console.log("📡 Fetching report by post ID:", postId);
        const reportByPostResponse = await fetch(
          `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/by-post/${postId}`
        );

        if (reportByPostResponse.ok) {
          const reportByPostData = await reportByPostResponse.json();

          if (reportByPostData.success && reportByPostData.report) {
            const report = reportByPostData.report;
            reportId = report.id; // Get the actual report ID

            console.log("✅ Found complete report by post ID:", report);

            // Set final remarks
            setFinalRemarks(report.generalNotes || "");
            console.log("📝 Final remarks set:", report.generalNotes);

            // Load checklist items if available
            if (report.checklistItems && report.checklistItems.length > 0) {
              const convertedChecklist = {};
              report.checklistItems.forEach((item) => {
                if (!convertedChecklist[item.category]) {
                  convertedChecklist[item.category] = {};
                }
                convertedChecklist[item.category][item.itemName] = {
                  checked: item.isChecked || false,
                  condition: item.conditionRating || "",
                  remarks: item.remarks || "",
                  // Removed repair cost field
                };
              });
              setChecklistData(convertedChecklist);
              console.log(
                "✅ Checklist data loaded from report:",
                convertedChecklist
              );
              console.log(
                "✅ View mode data loading complete - checklistData should now show saved conditions"
              );
            } else {
              console.log(
                "⚠️ No checklist items found in report, loading separately..."
              );
              // If checklist items are not included in report, load them separately
              try {
                const checklistResponse = await fetch(
                  `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}/checklist`
                );
                const checklistData = await checklistResponse.json();

                if (checklistData.success && checklistData.checklist) {
                  const convertedChecklist = {};
                  checklistData.checklist.forEach((item) => {
                    if (!convertedChecklist[item.category]) {
                      convertedChecklist[item.category] = {};
                    }
                    convertedChecklist[item.category][item.itemName] = {
                      checked: item.isChecked || false,
                      condition: item.conditionRating || "",
                      remarks: item.remarks || "",
                    };
                  });
                  setChecklistData(convertedChecklist);
                  console.log(
                    "✅ Checklist data loaded separately:",
                    convertedChecklist
                  );
                  console.log(
                    "✅ View mode data loading complete via separate API call - checklistData should show saved conditions"
                  );
                }
              } catch (error) {
                console.error("❌ Failed to load checklist data:", error);
              }
            }

            // Load files if available
            if (report.files && report.files.length > 0) {
              setUploadedFiles(report.files);
              console.log("✅ Files loaded:", report.files);
            } else {
              console.log("⚠️ No files found in report");
            }

            console.log(
              "✅ Successfully loaded complete report data from database"
            );
            toast.success("Inspection report loaded successfully!");
            return;
          } else {
            console.log(
              "❌ Report data not found or invalid response:",
              reportByPostData
            );
          }
        } else {
          console.log(
            "❌ HTTP error loading report by post ID:",
            reportByPostResponse.status
          );
        }
      } catch (reportByPostError) {
        console.log("❌ Error loading report by post ID:", reportByPostError);
      }

      // Fallback: If we have a report ID, try to load data piece by piece
      if (reportId) {
        console.log("🔄 Trying to load report data using report ID:", reportId);
        let hasLoadedData = false;

        // Try to load checklist items from database
        try {
          const checklistResponse = await fetch(
            `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}/checklist`
          );
          const checklistData = await checklistResponse.json();

          if (checklistData.success && checklistData.checklist) {
            // Convert database format to frontend format
            const convertedChecklist = {};
            checklistData.checklist.forEach((item) => {
              if (!convertedChecklist[item.category]) {
                convertedChecklist[item.category] = {};
              }
              convertedChecklist[item.category][item.itemName] = {
                checked: item.isChecked,
                condition: item.conditionRating || "",
                remarks: item.remarks || "",
              };
            });
            setChecklistData(convertedChecklist);
            hasLoadedData = true;
          }
        } catch (checklistError) {
          console.log("No checklist data found in database");
        }

        // Try to load files
        try {
          const files = await FileUploadService.getFiles(reportId);
          setUploadedFiles(files);
        } catch (filesError) {
          console.log("No files found for this report");
          setUploadedFiles([]);
        }

        // Try to load report details
        try {
          const reportResponse = await fetch(
            `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}`
          );
          const reportData = await reportResponse.json();

          if (reportData.success && reportData.report) {
            setFinalRemarks(reportData.report.generalNotes || "");
            hasLoadedData = true;
          }
        } catch (reportError) {
          console.log("No report details found");
        }

        if (hasLoadedData) {
          console.log("Loaded partial report data using report ID");
          toast.success("Inspection report loaded successfully!");
        }
      }

      // If still no data, show appropriate message
      if (!reportId || reportId === postId) {
        console.log("No inspection report found for post ID:", postId);
        toast.info(
          "No inspection report found for this completed post. This may be a legacy completion."
        );
      }
    } catch (error) {
      console.error("Error loading complete report data:", error);
      toast.warning("Unable to load report data. Showing empty report view.");
    }
  }, [post?.id, post?.inspectionReportId]);

  useEffect(() => {
    const initializeInspection = async () => {
      if (show && post) {
        setDraftLoaded(false); // Reset draft loaded state

        // Initialize checklist items cache if we have a report ID
        if (post?.inspectionReportId) {
          console.log(
            "🔄 Initializing checklist items cache for report:",
            post.inspectionReportId
          );
          await loadChecklistItems(post.inspectionReportId);

          // If in view mode, load all saved data
          if (isViewMode) {
            console.log("🔍 View mode detected, loading saved data...");
            await loadInspectionReport(post.inspectionReportId);
            await loadUploadedFiles(post.inspectionReportId);
          }
        } else {
          // Try to find existing report by post ID
          console.log(
            "🔍 No inspectionReportId found, looking for existing report by post ID:",
            post.id
          );
          try {
            const reportByPostResponse = await fetch(
              `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/by-post/${post.id}`
            );

            if (reportByPostResponse.ok) {
              const reportByPostData = await reportByPostResponse.json();
              if (reportByPostData.success && reportByPostData.report) {
                post.inspectionReportId = reportByPostData.report.id;
                console.log(
                  "✅ Found existing report ID:",
                  post.inspectionReportId
                );
                await loadChecklistItems(post.inspectionReportId);

                // If in view mode, load all saved data
                if (isViewMode) {
                  console.log("🔍 View mode detected, loading saved data...");
                  await loadInspectionReport(post.inspectionReportId);
                  await loadUploadedFiles(post.inspectionReportId);
                }
              } else {
                // No existing report found - create a new one
                console.log(
                  "🆕 No existing report found, creating new inspection report for post:",
                  post.id
                );
                try {
                  const technicianId = 1; // TODO: Get from user context
                  const report = await FileUploadService.startInspection(
                    post.id,
                    technicianId
                  );

                  if (report && report.id) {
                    post.inspectionReportId = report.id;
                    console.log(
                      "✅ Created new inspection report ID:",
                      report.id
                    );
                    await loadChecklistItems(report.id);

                    // If in view mode, load all saved data
                    if (isViewMode) {
                      console.log(
                        "🔍 View mode detected, loading saved data..."
                      );
                      await loadInspectionReport(report.id);
                      await loadUploadedFiles(report.id);
                    }
                  } else {
                    console.error("❌ Failed to create inspection report");
                  }
                } catch (createError) {
                  console.error(
                    "❌ Error creating inspection report:",
                    createError
                  );
                }
              }
            } else {
              // 404 or other error - create a new report
              console.log(
                "🆕 No existing report found (404), creating new inspection report for post:",
                post.id
              );
              try {
                const technicianId = 1; // TODO: Get from user context
                const report = await FileUploadService.startInspection(
                  post.id,
                  technicianId
                );

                if (report && report.id) {
                  post.inspectionReportId = report.id;
                  console.log(
                    "✅ Created new inspection report ID:",
                    report.id
                  );
                  await loadChecklistItems(report.id);
                } else {
                  console.error("❌ Failed to create inspection report");
                }
              } catch (createError) {
                console.error(
                  "❌ Error creating inspection report:",
                  createError
                );
              }
            }
          } catch (error) {
            console.log(
              "❌ Error checking for existing report, creating new one for post:",
              post.id
            );
            try {
              const technicianId = 1; // TODO: Get from user context
              const report = await FileUploadService.startInspection(
                post.id,
                technicianId
              );

              if (report && report.id) {
                post.inspectionReportId = report.id;
                console.log("✅ Created new inspection report ID:", report.id);
                await loadChecklistItems(report.id);
              } else {
                console.error("❌ Failed to create inspection report");
              }
            } catch (createError) {
              console.error(
                "❌ Error creating inspection report:",
                createError
              );
            }
          }
        }

        if (isViewMode) {
          // Load complete report data from database for view mode
          console.log("🔍 View mode detected, loading complete report data...");
          await loadCompleteReportData();
        } else {
          // Try to load existing draft first
          const draftLoaded = loadDraft(post.id);

          if (!draftLoaded) {
            // Initialize checklist data with dealership conditions if no draft exists
            const initialData = {};
            Object.keys(inspectionCategories).forEach((category) => {
              initialData[category] = {};
              inspectionCategories[category].items.forEach((item) => {
                initialData[category][item] = {
                  checked: false,
                  condition: "", // Single condition instead of multiple boolean flags
                  remarks: "",
                  // Removed repair cost field
                };
              });
            });
            setChecklistData(initialData);
          }

          // Load existing files from backend
          await loadExistingFiles();
        }
      }
    };

    initializeInspection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    show,
    post,
    isViewMode,
    loadCompleteReportData,
    loadExistingFiles,
    loadChecklistItems,
    loadInspectionReport,
    loadUploadedFiles,
  ]);

  useEffect(() => {
    if (show) {
      setActiveTab(initialTab);
    }
  }, [show, initialTab]);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Get or create inspection report ID
      let reportId = post?.inspectionReportId;

      if (!reportId) {
        // Start inspection to get report ID
        const technicianId = 1; // TODO: Get from user context
        const report = await FileUploadService.startInspection(
          post.id,
          technicianId
        );
        reportId = report?.id;

        if (!reportId) {
          throw new Error("Failed to create inspection report");
        }

        // Update post with report ID
        post.inspectionReportId = reportId;
      }

      const uploadedFileData = await FileUploadService.uploadFiles(
        reportId,
        files
      );

      setUploadedFiles((prev) => {
        const newFilesList = [...prev, ...uploadedFileData];
        // Auto-save draft after file upload
        if (post?.id) {
          saveDraft(post.id, {
            checklistData,
            finalRemarks,
            uploadedFiles: newFilesList,
          });
        }
        return newFilesList;
      });

      toast.success(`${files.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(error.message || "Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async (fileId) => {
    try {
      const reportId = post?.inspectionReportId;

      if (reportId) {
        await FileUploadService.deleteFile(reportId, fileId);
      }

      setUploadedFiles((prev) => {
        const newFilesList = prev.filter((f) => f.id !== fileId);
        // Auto-save draft after file removal
        if (post?.id) {
          saveDraft(post.id, {
            checklistData,
            finalRemarks,
            uploadedFiles: newFilesList,
          });
        }
        return newFilesList;
      });

      toast.info("File removed successfully");
    } catch (error) {
      console.error("File removal error:", error);
      toast.error(error.message || "Failed to remove file. Please try again.");
    }
  };

  const handleChecklistUpdate = (category, item, field, value) => {
    // Create a unique key for this update
    const updateKey = `${category}-${item}-${field}`;

    // Check if this is a duplicate of the last saved value
    const lastSaved = lastSavedValues.current.get(updateKey);
    if (lastSaved === value) {
      console.log(`🔄 Skipping duplicate save for ${updateKey}: ${value}`);
      return;
    }

    // Update local state immediately for responsive UI
    setChecklistData((prev) => {
      const newData = {
        ...prev,
        [category]: {
          ...prev[category],
          [item]: {
            ...prev[category][item],
            [field]: value,
          },
        },
      };

      // Check if all items in this category are now checked
      if (field === "checked" && value) {
        const categoryItems = inspectionCategories[category].items;
        const allChecked = categoryItems.every(
          (categoryItem) =>
            categoryItem === item ||
            (newData[category][categoryItem] &&
              newData[category][categoryItem].checked)
        );

        if (allChecked) {
          setCompletedSections((prev) => new Set([...prev, category]));
        }
      } else if (field === "checked" && !value) {
        // Remove from completed sections if item is unchecked
        setCompletedSections((prev) => {
          const newSet = new Set(prev);
          newSet.delete(category);
          return newSet;
        });
      }

      // Auto-save draft after update (immediate)
      if (post?.id) {
        saveDraft(post.id, {
          checklistData: newData,
          finalRemarks,
          uploadedFiles,
        });
      }

      return newData;
    });

    // Debounced save to database to prevent rapid API calls
    if (post?.inspectionReportId) {
      // Cancel any pending request for this specific item
      const pendingRequest = pendingRequests.current.get(updateKey);
      if (pendingRequest) {
        pendingRequest.abort();
        pendingRequests.current.delete(updateKey);
      }

      // Get or create debounced save function for this item
      if (!debouncedSaves.current.has(updateKey)) {
        const debouncedSave = debounce((cat, itm, fld, val) => {
          saveChecklistItemToDatabase(cat, itm, fld, val);
        }, 300); // 300ms debounce delay
        debouncedSaves.current.set(updateKey, debouncedSave);
      }

      const debouncedSave = debouncedSaves.current.get(updateKey);
      debouncedSave(category, item, field, value);
    }
  };

  // Save checklist item to database with improved error handling and request cancellation
  const saveChecklistItemToDatabase = async (
    category,
    itemName,
    field,
    value
  ) => {
    // Create a unique key for this save operation
    const saveKey = `${category}-${itemName}-${field}`;

    try {
      const reportId = post?.inspectionReportId;
      if (!reportId) {
        console.warn("⚠️ No report ID available");
        return;
      }

      // Check if this value is already saved
      const lastSaved = lastSavedValues.current.get(saveKey);
      if (lastSaved === value) {
        console.log(`🔄 Value already saved for ${saveKey}: ${value}`);
        return;
      }

      setSavingStates((prev) => ({ ...prev, [saveKey]: true }));
      setAnySaving(true);

      console.log(`🔍 Starting save operation:`, {
        reportId,
        category,
        itemName,
        field,
        value,
        saveKey,
      });

      // Get checklist items (use cache if available, otherwise load)
      let checklistItems = checklistItemsCache;
      if (!checklistItems) {
        console.log("🔄 Cache miss, loading checklist items...");
        checklistItems = await loadChecklistItems(reportId);
        if (!checklistItems) {
          console.error("❌ Failed to load checklist items");
          setSavingStates((prev) => ({ ...prev, [saveKey]: false }));
          return;
        }
      }

      // Find the checklist item
      const checklistItem = checklistItems.find(
        (item) => item.category === category && item.itemName === itemName
      );

      if (!checklistItem) {
        console.error("❌ Checklist item not found:", { category, itemName });
        console.log(
          "Available items:",
          checklistItems.map((item) => ({
            category: item.category,
            itemName: item.itemName,
          }))
        );
        setSavingStates((prev) => ({ ...prev, [saveKey]: false }));
        return;
      }

      // Prepare update data
      const updateData = {};

      if (field === "checked") {
        updateData.isChecked = value;
      } else if (field === "condition") {
        updateData.conditionRating = value;
      } else if (field === "remarks") {
        updateData.remarks = value;
      }

      console.log(`📤 Sending update to database:`, {
        itemId: checklistItem.id,
        itemName: itemName,
        field: field,
        value: value,
        updateData: updateData,
        url: `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}/checklist/${checklistItem.id}`,
      });

      // Create AbortController for request cancellation
      const abortController = new AbortController();
      pendingRequests.current.set(saveKey, abortController);

      // Update the checklist item in database with cancellation support
      const updateResponse = await fetch(
        `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}/checklist/${checklistItem.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
          signal: abortController.signal,
        }
      );

      if (updateResponse.ok) {
        const responseData = await updateResponse.json();
        console.log(
          `✅ Successfully saved ${field} to database for item: ${itemName}`,
          responseData
        );

        // Update cache with new data
        if (responseData.success && responseData.item) {
          setChecklistItemsCache((prev) =>
            prev
              ? prev.map((item) =>
                  item.id === checklistItem.id ? responseData.item : item
                )
              : null
          );
        }

        // Update last saved value to prevent duplicate saves
        lastSavedValues.current.set(saveKey, value);

        // Show success toast for important updates
        if (field === "condition") {
          toast.success(`✅ ${itemName} condition saved as "${value}"`);
        }
      } else {
        const errorData = await updateResponse.text();
        console.error(
          `❌ Failed to save ${field} to database for item: ${itemName}`,
          {
            status: updateResponse.status,
            statusText: updateResponse.statusText,
            error: errorData,
          }
        );
        toast.error(`❌ Failed to save ${field} for ${itemName}`);
      }

      // Cleanup
      pendingRequests.current.delete(saveKey);
      setSavingStates((prev) => {
        const newStates = { ...prev, [saveKey]: false };
        // Check if any save operations are still in progress
        const stillSaving = Object.values(newStates).some((state) => state);
        setAnySaving(stillSaving);
        return newStates;
      });
    } catch (error) {
      // Check if this was an abort error (request was cancelled)
      if (error.name === "AbortError") {
        console.log(`🔄 Request cancelled for ${saveKey}: ${error.message}`);
        return;
      }

      console.error("❌ Error saving checklist item to database:", error);
      toast.error(`❌ Error saving data: ${error.message}`);

      // Cleanup
      pendingRequests.current.delete(saveKey);
      setSavingStates((prev) => {
        const newStates = { ...prev, [saveKey]: false };
        // Check if any save operations are still in progress
        const stillSaving = Object.values(newStates).some((state) => state);
        setAnySaving(stillSaving);
        return newStates;
      });
    }
  };

  // Save final remarks to database (remarks are saved when submitting the report)
  const saveFinalRemarksToDatabase = async (remarks) => {
    try {
      console.log(
        "Final remarks will be saved when report is submitted:",
        remarks
      );
      // Final remarks are saved through the submit endpoint, not a separate update
      // This function is kept for compatibility but doesn't need to make API calls
    } catch (error) {
      console.error("Error with final remarks:", error);
    }
  };

  const getCompletionStats = () => {
    let totalItems = 0;
    let checkedItems = 0;
    let totalRepairCost = 0;

    Object.keys(checklistData).forEach((category) => {
      Object.keys(checklistData[category]).forEach((item) => {
        totalItems++;
        const itemData = checklistData[category][item];
        if (itemData.checked) {
          checkedItems++;
        }
        // Removed repair cost calculation
      });
    });

    return {
      totalItems,
      checkedItems,
      totalRepairCost,
      completionPercentage:
        totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0,
      completedSections: completedSections.size,
      totalSections: Object.keys(inspectionCategories).length,
      sectionCompletionPercentage:
        Object.keys(inspectionCategories).length > 0
          ? Math.round(
              (completedSections.size /
                Object.keys(inspectionCategories).length) *
                100
            )
          : 0,
    };
  };

  const handleCompleteReport = () => {
    // Show completion confirmation modal
    setShowCompletionConfirmModal(true);
  };

  const handleConfirmCompletion = async () => {
    // Prevent multiple rapid clicks
    if (completing) {
      console.log("🔄 Complete already in progress, ignoring click");
      return;
    }

    const stats = getCompletionStats();

    setCompleting(true);
    setShowCompletionConfirmModal(false); // Close the confirmation modal

    // Cancel any pending requests before final completion
    cancelPendingRequests();

    try {
      let reportId = post?.inspectionReportId;

      // If no report ID exists, create one
      if (!reportId) {
        try {
          const technicianId = 1; // TODO: Get from user context
          console.log("Creating inspection report for post:", post.id);
          const report = await FileUploadService.startInspection(
            post.id,
            technicianId
          );
          console.log("Inspection report response:", report);

          // Extract report ID from various possible response formats
          if (report) {
            reportId =
              report.id ||
              report.reportId ||
              report.inspectionReportId ||
              report.inspectionReport?.id ||
              report.report?.id;
          }

          if (!reportId) {
            console.error("No report ID found in response:", report);
            // Use the post ID as fallback
            reportId = post.id;
            console.log("Using post ID as fallback report ID:", reportId);
          }

          // Update post with report ID
          post.inspectionReportId = reportId;
          console.log("Updated post with report ID:", reportId);
        } catch (reportError) {
          console.error("Error creating inspection report:", reportError);
          // Continue with completion anyway - use post ID as report ID
          reportId = post.id;
          post.inspectionReportId = reportId;
          console.log("Continuing with post ID as report ID:", reportId);
        }
      }

      // Step 1: Save all checklist data to database using bulk update
      try {
        console.log("📋 Step 1: Saving all checklist data to database...");

        // Prepare bulk updates for all checklist items
        const bulkUpdates = [];

        // Get checklist items from cache to find itemIds
        let checklistItems = checklistItemsCache;
        if (!checklistItems) {
          console.log(
            "🔄 Cache miss during bulk save, loading checklist items..."
          );
          checklistItems = await loadChecklistItems(reportId);
          if (!checklistItems) {
            console.error("❌ Failed to load checklist items for bulk save");
            throw new Error("Failed to load checklist items");
          }
        }

        Object.keys(checklistData).forEach((category) => {
          Object.keys(checklistData[category]).forEach((item) => {
            const itemData = checklistData[category][item];
            if (itemData.checked || itemData.condition || itemData.remarks) {
              // Find the checklist item to get its ID
              const checklistItem = checklistItems.find(
                (cachedItem) =>
                  cachedItem.category === category &&
                  cachedItem.itemName === item
              );

              if (checklistItem) {
                bulkUpdates.push({
                  itemId: checklistItem.id, // Add the required itemId
                  category: category,
                  itemName: item,
                  isChecked: itemData.checked || false,
                  conditionRating: itemData.condition || null,
                  remarks: itemData.remarks || null,
                });
                console.log(
                  `📋 Adding to bulk update: ${category} - ${item} (ID: ${checklistItem.id})`
                );
              } else {
                console.warn(
                  `⚠️ Checklist item not found for bulk update: ${category} - ${item}`
                );
              }
            }
          });
        });

        if (bulkUpdates.length > 0) {
          console.log(
            `📋 Saving ${bulkUpdates.length} checklist items via bulk update...`
          );
          console.log("📋 Bulk updates payload:", bulkUpdates);

          const bulkResponse = await fetch(
            `${API_CONFIG.API_GATEWAY_URL}/tech-dashboard/api/v1/dashboard/reports/${reportId}/checklist/bulk`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ updates: bulkUpdates }),
            }
          );

          if (bulkResponse.ok) {
            const bulkData = await bulkResponse.json();
            console.log("✅ Bulk checklist save successful:", bulkData);
            console.log(
              `✅ Updated ${bulkData.updatedItems?.length || 0} items`
            );
          } else {
            const errorText = await bulkResponse.text();
            console.error("❌ Bulk checklist save failed:", {
              status: bulkResponse.status,
              statusText: bulkResponse.statusText,
              error: errorText,
            });
            console.warn(
              "⚠️ Bulk checklist save failed, but continuing with individual saves"
            );
          }
        } else {
          console.log("📋 No checklist items to save");
        }
      } catch (bulkError) {
        console.warn(
          "⚠️ Bulk save error, but continuing with individual saves:",
          bulkError
        );
      }

      // Step 2: Ensure all files are properly uploaded and associated
      try {
        console.log("📁 Step 2: Verifying file uploads...");
        console.log(`📁 Found ${uploadedFiles.length} uploaded files`);

        // Files are already uploaded when selected, but let's verify they're all associated
        if (uploadedFiles.length > 0) {
          console.log(
            "📁 Files already uploaded and associated with report:",
            uploadedFiles.map((f) => f.filename || f.name)
          );
        }
      } catch (fileError) {
        console.warn("⚠️ File verification error:", fileError);
      }

      // Step 3: Save final remarks to database
      try {
        console.log("💬 Step 3: Saving final remarks...");
        if (finalRemarks && finalRemarks.trim()) {
          await saveFinalRemarksToDatabase(finalRemarks);
          console.log("✅ Final remarks saved successfully");
        } else {
          console.log("💬 No final remarks to save");
        }
      } catch (remarksError) {
        console.warn("⚠️ Final remarks save error:", remarksError);
      }

      // Step 4: Complete the inspection report
      try {
        console.log(
          "✅ Step 4: Completing inspection report with ID:",
          reportId
        );
        const completedReport =
          await FileUploadService.completeInspectionReport(reportId, {
            finalRemarks: finalRemarks,
            checklistData: checklistData,
            completionStats: stats,
          });
        console.log("Inspection report completed:", completedReport);

        const inspectionData = {
          postId: post.id,
          reportId: reportId,
          checklistData,
          uploadedFiles,
          finalRemarks,
          completionStats: stats,
          completedReport,
        };

        // Create comprehensive completion summary
        const completionSummary = {
          checklistItems: Object.keys(checklistData).reduce(
            (total, category) =>
              total + Object.keys(checklistData[category]).length,
            0
          ),
          files: uploadedFiles.length,
          hasRemarks: finalRemarks && finalRemarks.trim().length > 0,
          completionPercentage: Math.round(
            (stats.checkedItems / stats.totalItems) * 100
          ),
        };

        console.log("✅ Inspection completed successfully:", inspectionData);
        console.log("📊 Completion Summary:", completionSummary);

        // Show comprehensive success message
        const successMessage = `✅ Inspection completed successfully! 
          📋 ${completionSummary.checklistItems} items | 
          📁 ${completionSummary.files} files | 
          ${completionSummary.hasRemarks ? "💬 Remarks" : "💬 No remarks"} | 
          ${completionSummary.completionPercentage}% complete`;

        toast.success(successMessage);

        // Clear draft after successful completion
        if (post?.id) {
          clearDraft(post.id);
        }

        // Call the onComplete callback to update the dashboard
        if (onComplete) {
          onComplete(inspectionData);
        }

        // Close the form after completion
        onHide();
      } catch (completeError) {
        console.error("Error completing inspection report:", completeError);
        toast.error("Failed to complete inspection report. Please try again.");
      }
    } catch (error) {
      console.error("Inspection completion error:", error);
      toast.error(
        error.message || "Failed to complete inspection. Please try again."
      );
    } finally {
      setCompleting(false);
    }
  };

  const stats = getCompletionStats();

  // No longer needed - replaced with direct state management

  const getFileIcon = (type) => {
    if (type.startsWith("image/")) return <FaImage className="text-primary" />;
    if (type.startsWith("video/")) return <FaVideo className="text-success" />;
    if (type.startsWith("audio/"))
      return <FaMicrophone className="text-warning" />;
    return <FaFileAlt className="text-secondary" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" className="inspection-modal">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaCar className="me-2" />
            {isViewMode ? "Inspection Report - " : "Vehicle Inspection - "}
            {post?.name || `Post #${post?.id}`}
            {draftLoaded && !isViewMode && (
              <Badge bg="warning" className="ms-2">
                <FaFileAlt className="me-1" />
                Draft Loaded
              </Badge>
            )}
            {isViewMode && (
              <Badge
                bg={
                  post?.status === "COMPLETED" || post?.status === "completed"
                    ? "success"
                    : "info"
                }
                className="ms-2"
              >
                <FaEye className="me-1" />
                {post?.status === "COMPLETED" || post?.status === "completed"
                  ? "Completed Report"
                  : "View Only"}
              </Badge>
            )}
            {anySaving && !isViewMode && (
              <Badge bg="info" className="ms-2 pulse-animation">
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                Auto-saving...
              </Badge>
            )}
          </Modal.Title>
          {isViewMode &&
            post?.status !== "COMPLETED" &&
            post?.status !== "SUBMITTED" &&
            post?.status !== "completed" &&
            post?.status !== "submitted" && (
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => setIsViewMode(false)}
                className="ms-2"
              >
                <FaEdit className="me-1" />
                Enable Edit
              </Button>
            )}
        </Modal.Header>

        <Modal.Body className="p-0">
          {/* Enhanced Progress Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-bottom shadow-sm">
            <Row className="align-items-center">
              <Col md={12}>
                {/* Overall Progress */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong className="text-primary fs-5">
                      📋 Overall Progress
                    </strong>
                    <Badge
                      bg={
                        stats.completionPercentage >= 100
                          ? "success"
                          : stats.completionPercentage >= 75
                          ? "warning"
                          : "secondary"
                      }
                      className="px-3 py-2 fs-6"
                    >
                      {stats.completionPercentage >= 100
                        ? "✅ Complete"
                        : "🔄 In Progress"}
                    </Badge>
                  </div>
                  <ProgressBar className="mb-2" style={{ height: "8px" }}>
                    <ProgressBar
                      variant="success"
                      now={stats.completionPercentage}
                      label={`${stats.completionPercentage}%`}
                      style={{
                        background:
                          "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    />
                  </ProgressBar>
                </div>

                {/* Section Progress */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong className="text-info fs-6">
                      🎯 Sections Progress
                    </strong>
                  </div>
                  <ProgressBar className="mb-2" style={{ height: "6px" }}>
                    <ProgressBar
                      variant="info"
                      now={stats.sectionCompletionPercentage}
                      style={{
                        background:
                          "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)",
                      }}
                    />
                  </ProgressBar>
                </div>

                {/* Stats Row */}
                <Row className="g-2">
                  <Col sm={6} md={3}>
                    <div className="d-flex align-items-center bg-white rounded-3 p-2 shadow-sm">
                      <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                        <FaCheckCircle className="text-primary" size={16} />
                      </div>
                      <div>
                        <div className="fw-bold text-primary">
                          {stats.checkedItems}/{stats.totalItems}
                        </div>
                        <small className="text-muted">Items Done</small>
                      </div>
                    </div>
                  </Col>
                  <Col sm={6} md={3}>
                    <div className="d-flex align-items-center bg-white rounded-3 p-2 shadow-sm">
                      <div className="bg-info bg-opacity-10 rounded-circle p-2 me-2">
                        <FaClipboardCheck className="text-info" size={16} />
                      </div>
                      <div>
                        <div className="fw-bold text-info">
                          {stats.completedSections}/{stats.totalSections}
                        </div>
                        <small className="text-muted">Sections</small>
                      </div>
                    </div>
                  </Col>
                  <Col sm={6} md={3}>
                    <div className="d-flex align-items-center bg-white rounded-3 p-2 shadow-sm">
                      <div className="bg-success bg-opacity-10 rounded-circle p-2 me-2">
                        <FaUpload className="text-success" size={16} />
                      </div>
                      <div>
                        <div className="fw-bold text-success">
                          {uploadedFiles.length}
                        </div>
                        <small className="text-muted">Files</small>
                      </div>
                    </div>
                  </Col>
                  <Col sm={6} md={3}>
                    <div className="d-flex align-items-center bg-white rounded-3 p-2 shadow-sm">
                      <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-2">
                        <FaDollarSign className="text-warning" size={16} />
                      </div>
                      <div>
                        <div className="fw-bold text-warning">
                          ${stats.totalRepairCost.toFixed(0)}
                        </div>
                        <small className="text-muted">Est. Cost</small>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border-bottom">
            <div className="d-flex">
              <button
                className={`btn btn-link text-decoration-none px-4 py-3 ${
                  activeTab === "files"
                    ? "border-bottom border-primary text-primary"
                    : "text-muted"
                }`}
                onClick={() => setActiveTab("files")}
              >
                <FaUpload className="me-2" />
                File Upload (Optional)
              </button>
              <button
                className={`btn btn-link text-decoration-none px-4 py-3 ${
                  activeTab === "checklist"
                    ? "border-bottom border-primary text-primary"
                    : "text-muted"
                }`}
                onClick={() => setActiveTab("checklist")}
              >
                <FaClipboardCheck className="me-2" />
                Inspection Report
              </button>
              <button
                className={`btn btn-link text-decoration-none px-4 py-3 ${
                  activeTab === "remarks"
                    ? "border-bottom border-primary text-primary"
                    : "text-muted"
                }`}
                onClick={() => setActiveTab("remarks")}
              >
                <FaComments className="me-2" />
                Final Remarks
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {/* File Upload Tab */}
            {activeTab === "files" && (
              <div>
                <div className="mb-4">
                  <h5 className="mb-3">
                    <FaUpload className="me-2 text-primary" />
                    Upload Inspection Files (Optional)
                  </h5>
                  <Alert variant="info" className="mb-3">
                    <strong>📁 File uploads are optional!</strong> You can
                    complete inspections with or without files.
                    <br />
                    <strong>Supported formats:</strong> Images (JPG, PNG, GIF),
                    Videos (MP4, AVI, MOV), Audio (MP3, WAV, M4A), Documents
                    (PDF)
                    <br />
                    <strong>Maximum file size:</strong> 30MB per file •{" "}
                    <strong>Maximum files:</strong> 50 per inspection
                  </Alert>

                  <Form.Group>
                    <Form.Label className="fw-bold">Select Files</Form.Label>
                    <Form.Control
                      type="file"
                      multiple
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      disabled={uploading || isViewMode}
                      className="mb-3"
                    />
                    {uploading && (
                      <div className="text-center">
                        <div
                          className="spinner-border text-primary me-2"
                          role="status"
                        >
                          <span className="visually-hidden">Uploading...</span>
                        </div>
                        Uploading files...
                      </div>
                    )}
                  </Form.Group>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div>
                    <h6 className="mb-3">
                      Uploaded Files ({uploadedFiles.length})
                    </h6>
                    <Row>
                      {uploadedFiles.map((file) => (
                        <Col md={6} lg={4} key={file.id} className="mb-3">
                          <Card className="h-100">
                            <Card.Body className="p-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="d-flex align-items-center">
                                  {getFileIcon(file.contentType || file.type)}
                                  <span
                                    className="ms-2 fw-bold text-truncate"
                                    style={{ maxWidth: "150px" }}
                                  >
                                    {file.originalFilename || file.name}
                                  </span>
                                </div>
                                {!isViewMode && (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleRemoveFile(file.id)}
                                  >
                                    <FaTrash />
                                  </Button>
                                )}
                              </div>
                              <small className="text-muted d-block">
                                Size:{" "}
                                {formatFileSize(file.fileSize || file.size)}
                              </small>
                              <small className="text-muted d-block">
                                Uploaded:{" "}
                                {file.uploadedAt
                                  ? new Date(
                                      file.uploadedAt
                                    ).toLocaleTimeString()
                                  : "Unknown"}
                              </small>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </div>
            )}

            {/* Modern Grid-Based Inspection Interface */}
            {activeTab === "checklist" && (
              <div className="modern-inspection-grid">
                <div className="inspection-sidebar">
                  <h5 className="sidebar-title">
                    <FaClipboardCheck className="me-2" />
                    Inspection Categories
                  </h5>
                  <div className="category-list">
                    {Object.entries(inspectionCategories).map(
                      ([categoryKey, category], index) => {
                        const categoryItems = checklistData[categoryKey] || {};
                        const checkedCount = Object.values(
                          categoryItems
                        ).filter((item) => item.checked).length;
                        const totalCount = category.items.length;
                        const completionRate =
                          totalCount > 0
                            ? Math.round((checkedCount / totalCount) * 100)
                            : 0;
                        const isCompleted = completedSections.has(categoryKey);

                        return (
                          <div
                            key={categoryKey}
                            className={`category-card ${
                              activeAccordionKey === index.toString()
                                ? "active"
                                : ""
                            } ${isCompleted ? "completed" : ""}`}
                            onClick={() => {
                              setActiveAccordionKey(index.toString());
                              // Scroll to top of content area when switching categories
                              requestAnimationFrame(() => {
                                const contentArea = document.querySelector(
                                  ".inspection-content"
                                );
                                if (contentArea) {
                                  contentArea.scrollTo({
                                    top: 0,
                                    behavior: "instant", // Use instant for immediate positioning
                                  });
                                }

                                // Alternative method - scroll to category header
                                const categoryElement = document.querySelector(
                                  `#category-${categoryKey}`
                                );
                                if (categoryElement) {
                                  categoryElement.scrollIntoView({
                                    behavior: "instant",
                                    block: "start",
                                    inline: "nearest",
                                  });
                                }
                              });
                            }}
                          >
                            <div className="category-header">
                              <div className="category-icon">
                                {isCompleted ? (
                                  <FaCheckCircle className="text-success" />
                                ) : (
                                  <span className="category-emoji">
                                    {category.title.split(" ")[0]}
                                  </span>
                                )}
                              </div>
                              <div className="category-info">
                                <div className="category-name">
                                  {category.title.replace(/^[^\s]+\s/, "")}
                                </div>
                                <div className="category-progress">
                                  <span className="progress-text">
                                    {checkedCount}/{totalCount}
                                  </span>
                                  <div className="progress-bar-mini">
                                    <div
                                      className="progress-fill"
                                      style={{ width: `${completionRate}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {isCompleted && (
                              <div className="completion-badge">✓</div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="inspection-content">
                  {Object.entries(inspectionCategories).map(
                    ([categoryKey, category], index) => {
                      if (activeAccordionKey !== index.toString()) return null;

                      const categoryItems = checklistData[categoryKey] || {};

                      return (
                        <div
                          key={categoryKey}
                          className="active-category"
                          id={`category-${categoryKey}`}
                        >
                          <div className="category-content-header">
                            <h4 className="content-title">{category.title}</h4>
                            <div className="category-stats">
                              <Badge bg="primary" className="me-2">
                                {
                                  Object.values(categoryItems).filter(
                                    (item) => item.checked
                                  ).length
                                }
                                /{category.items.length} Items
                              </Badge>
                              <Badge bg="info">
                                {Math.round(
                                  (Object.values(categoryItems).filter(
                                    (item) => item.checked
                                  ).length /
                                    category.items.length) *
                                    100
                                ) || 0}
                                % Complete
                              </Badge>
                            </div>
                          </div>

                          <div className="items-grid">
                            {category.items.map((item, itemIndex) => {
                              const itemData = categoryItems[item] || {
                                checked: false,
                                condition: "",
                                remarks: "",
                                // Removed repair cost field
                              };

                              return (
                                <div
                                  key={itemIndex}
                                  className={`item-card ${
                                    itemData.checked ? "completed" : ""
                                  }`}
                                >
                                  <div className="item-header">
                                    <div className="item-checkbox">
                                      <Form.Check
                                        type="checkbox"
                                        id={`${categoryKey}-${itemIndex}`}
                                        checked={itemData.checked}
                                        onChange={(e) => {
                                          handleChecklistUpdate(
                                            categoryKey,
                                            item,
                                            "checked",
                                            e.target.checked
                                          );
                                          if (
                                            !e.target.checked &&
                                            itemData.condition
                                          ) {
                                            handleChecklistUpdate(
                                              categoryKey,
                                              item,
                                              "condition",
                                              ""
                                            );
                                          }
                                        }}
                                        disabled={isViewMode}
                                      />
                                    </div>
                                    <div className="item-title">
                                      <label
                                        htmlFor={`${categoryKey}-${itemIndex}`}
                                        className={`item-label ${
                                          itemData.checked ? "completed" : ""
                                        }`}
                                      >
                                        {item}
                                      </label>
                                    </div>
                                    {itemData.checked && (
                                      <div className="completion-icon">✅</div>
                                    )}
                                  </div>

                                  <div className="item-conditions">
                                    <div className="conditions-grid">
                                      {inspectionConditions.map((condition) => {
                                        const saveKey = `${categoryKey}-${item}-condition`;
                                        const isSaving = savingStates[saveKey];

                                        return (
                                          <button
                                            key={condition.key}
                                            type="button"
                                            className={`condition-btn ${
                                              condition.color
                                            } ${
                                              itemData.condition ===
                                              condition.key
                                                ? "selected"
                                                : ""
                                            } ${isSaving ? "saving" : ""} ${
                                              isViewMode ? "view-mode" : ""
                                            }`}
                                            onClick={() => {
                                              const updates = [
                                                {
                                                  field: "condition",
                                                  value: condition.key,
                                                },
                                                ...(!itemData.checked
                                                  ? [
                                                      {
                                                        field: "checked",
                                                        value: true,
                                                      },
                                                    ]
                                                  : []),
                                              ];

                                              updates.forEach((update) => {
                                                handleChecklistUpdate(
                                                  categoryKey,
                                                  item,
                                                  update.field,
                                                  update.value
                                                );
                                              });
                                            }}
                                            disabled={isViewMode || isSaving}
                                            title={
                                              isSaving
                                                ? "Saving..."
                                                : `Set condition to ${condition.label}`
                                            }
                                          >
                                            {isSaving ? (
                                              <>
                                                <span
                                                  className="spinner-border spinner-border-sm me-1"
                                                  role="status"
                                                  aria-hidden="true"
                                                ></span>
                                                Saving...
                                              </>
                                            ) : (
                                              condition.label
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {(itemData.checked || itemData.condition) && (
                                    <div className="item-details">
                                      <div className="detail-row">
                                        {/* Removed repair cost input field */}
                                      </div>
                                      <div className="detail-row">
                                        <Form.Control
                                          as="textarea"
                                          rows={2}
                                          size="sm"
                                          placeholder="Additional notes..."
                                          value={itemData.remarks}
                                          onChange={(e) =>
                                            handleChecklistUpdate(
                                              categoryKey,
                                              item,
                                              "remarks",
                                              e.target.value
                                            )
                                          }
                                          disabled={isViewMode}
                                          className="remarks-input"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Final Remarks Tab */}
            {activeTab === "remarks" && (
              <div>
                <h5 className="mb-3">
                  <FaComments className="me-2 text-primary" />
                  Final Inspection Remarks
                </h5>
                <Alert variant="info" className="mb-3">
                  Provide a comprehensive summary of the vehicle's overall
                  condition, any major concerns, and recommendations for the
                  customer. <strong>This field is optional.</strong>
                </Alert>

                <Form.Group>
                  <Form.Label className="fw-bold">
                    Overall Assessment & Recommendations
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={8}
                    placeholder="Enter your final remarks about the vehicle's overall condition, safety concerns, recommended repairs, and any other important observations..."
                    value={finalRemarks}
                    onChange={(e) => {
                      const newRemarks = e.target.value;
                      setFinalRemarks(newRemarks);
                      // Auto-save draft after remarks update
                      if (post?.id) {
                        saveDraft(post.id, {
                          checklistData,
                          finalRemarks: newRemarks,
                          uploadedFiles,
                        });
                      }
                      // Save to database if we have a report ID
                      if (post?.inspectionReportId) {
                        saveFinalRemarksToDatabase(newRemarks);
                      }
                    }}
                    disabled={isViewMode}
                    className="mb-3"
                  />
                  <small className="text-muted">
                    {finalRemarks.length} characters • Optional field
                  </small>
                </Form.Group>

                {/* Summary Card */}
                <Card className="mt-4 bg-light">
                  <Card.Body>
                    <h6 className="mb-3">Inspection Summary</h6>
                    <Row>
                      <Col md={4}>
                        <div className="text-center">
                          <div className="h4 text-primary mb-1">
                            {stats.checkedItems}
                          </div>
                          <small className="text-muted">Items Checked</small>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center">
                          <div className="h4 text-success mb-1">
                            {stats.completionPercentage}%
                          </div>
                          <small className="text-muted">Complete</small>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center">
                          <div className="h4 text-warning mb-1">
                            {uploadedFiles.length}
                          </div>
                          <small className="text-muted">Files Uploaded</small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="border-top bg-light">
          <Button
            variant="outline-secondary"
            onClick={onHide}
            disabled={completing}
          >
            Cancel
          </Button>
          {!isViewMode && (
            <Button
              variant="success"
              onClick={handleCompleteReport}
              disabled={completing}
              title="Complete inspection report"
            >
              {completing ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Completing...
                </>
              ) : (
                <>
                  <FaCheckCircle className="me-2" />
                  Complete Inspection
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Completion Confirmation Modal */}
      <Modal
        show={showCompletionConfirmModal}
        onHide={() => setShowCompletionConfirmModal(false)}
        size="md"
        centered
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FaCheckCircle className="me-2" />
            Complete Inspection
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div className="mb-4">
              <FaCheckCircle className="text-success" size={48} />
            </div>
            <h5 className="mb-3">
              Are you sure you want to complete this inspection?
            </h5>
            <p className="text-muted mb-4">
              This action will mark the inspection as complete and cannot be
              undone. Please ensure all information is accurate before
              proceeding.
            </p>

            {/* Inspection Summary */}
            <Card className="bg-light">
              <Card.Body>
                <h6 className="mb-3">Inspection Summary</h6>
                <Row>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="h4 text-primary mb-1">
                        {getCompletionStats().checkedItems}
                      </div>
                      <small className="text-muted">Items Checked</small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="h4 text-success mb-1">
                        {getCompletionStats().completionPercentage}%
                      </div>
                      <small className="text-muted">Complete</small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="h4 text-warning mb-1">
                        {uploadedFiles.length}
                      </div>
                      <small className="text-muted">Files</small>
                    </div>
                  </Col>
                </Row>
                {finalRemarks && finalRemarks.trim() && (
                  <div className="mt-3 pt-3 border-top">
                    <small className="text-muted">Final Remarks:</small>
                    <p className="mb-0 small">{finalRemarks}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowCompletionConfirmModal(false)}
            disabled={completing}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleConfirmCompletion}
            disabled={completing}
          >
            {completing ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Completing...
              </>
            ) : (
              <>
                <FaCheckCircle className="me-2" />
                Yes, Complete Inspection
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InspectionInterface;
