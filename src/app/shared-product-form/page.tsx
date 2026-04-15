"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

interface ProductData {
  id: string;
  name: string;
  image_url?: string;
  benefits?: string[];
  application_url: string;
  sender_name?: string;
  sender_phone?: string;
}

function SharedProductFormContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [finsangId, setFinsangId] = useState<number | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    income: "",
    pincode: "",
    age: "",
    dateOfBirth: "",
    pancard: "",
    employmentStatus: "",
    companyName: "",
    acceptTerms: false,
  });

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productId = searchParams.get("productId");
        const senderId = searchParams.get("senderId");

        if (!productId) {
          setError("Product ID is required");
          setLoading(false);
          return;
        }

        // Fetch product data from your API
        const response = await fetch(
          `/api/shared-products/get-product?productId=${productId}&senderId=${
            senderId || ""
          }`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch product data");
        }

        const data = await response.json();
        setProductData(data);
      } catch (err) {
        setError("Failed to load product information");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [searchParams]);

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleSelectChange = (field: string) => (event: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      acceptTerms: event.target.checked,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.mobile.trim()) return "Mobile number is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.pincode.trim()) return "Pincode is required";
    if (!formData.age.trim()) return "Age is required";
    if (!formData.dateOfBirth.trim()) return "Date of birth is required";
    if (!formData.pancard.trim()) return "PAN card is required";
    if (!formData.employmentStatus) return "Employment status is required";
    if (
      formData.employmentStatus === "employed" &&
      !formData.companyName.trim()
    ) {
      return "Company name is required for employed individuals";
    }
    if (!formData.acceptTerms) return "Please accept the terms and conditions";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email))
      return "Please enter a valid email address";

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(formData.mobile))
      return "Please enter a valid 10-digit mobile number";

    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(formData.pincode))
      return "Please enter a valid 6-digit pincode";

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 18 || age > 100)
      return "Please enter a valid age between 18 and 100";

    const pancardRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!pancardRegex.test(formData.pancard.toUpperCase())) {
      return "Please enter a valid PAN card number (e.g., ABCDE1234F)";
    }

    // Validate date of birth
    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    let ageFromDob = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      ageFromDob--;
    }

    if (ageFromDob < 18 || ageFromDob > 100) {
      return "Date of birth must correspond to an age between 18 and 100 years";
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/shared-products/submit-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: searchParams.get("productId"),
          senderId: searchParams.get("senderId"),
          userDetails: formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit details");
      }

      const result = await response.json();
      setSuccess(true);
      setFinsangId(result.finsangId);

      // Redirect to application process after a short delay
      setTimeout(() => {
        if (productData?.application_url) {
          window.location.href = productData.application_url;
        }
      }, 2000);
    } catch (err) {
      setError("Failed to submit details. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !productData) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="success">
          <Typography variant="h6" gutterBottom>
            Thank you! Your details have been submitted successfully.
          </Typography>
          {finsangId && (
            <Typography variant="body1" sx={{ mb: 1 }}>
              Your Finsang ID: <strong>{finsangId}</strong>
            </Typography>
          )}
          <Typography variant="body2">
            Redirecting to application process...
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          color="primary"
        >
          Apply for {productData?.name}
        </Typography>

        {productData && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                }}
              >
                {productData.image_url && (
                  <Box sx={{ flex: { sm: "0 0 200px" } }}>
                    <CardMedia
                      component="img"
                      image={productData.image_url}
                      alt={productData.name}
                      sx={{ height: 200, objectFit: "contain" }}
                    />
                  </Box>
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {productData.name}
                  </Typography>
                  {productData.benefits && productData.benefits.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Key Benefits:
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {productData.benefits.map((benefit, index) => (
                          <Chip
                            key={index}
                            label={benefit}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {productData.sender_name && (
                    <Typography variant="body2" color="text.secondary">
                      Shared by: {productData.sender_name}
                      {productData.sender_phone &&
                        ` (${productData.sender_phone})`}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h6" gutterBottom>
          Please fill in your details to proceed:
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Personal Information */}
            <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 1 }}>
              Personal Information
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 3,
              }}
            >
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={handleInputChange("name")}
                required
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Mobile Number"
                value={formData.mobile}
                onChange={handleInputChange("mobile")}
                required
                variant="outlined"
                placeholder="10-digit number"
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 3,
              }}
            >
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                required
                variant="outlined"
              />
              <TextField
                fullWidth
                label="PAN Card Number"
                value={formData.pancard}
                onChange={handleInputChange("pancard")}
                required
                variant="outlined"
                placeholder="ABCDE1234F"
                inputProps={{
                  style: { textTransform: "uppercase" },
                  maxLength: 10,
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 3,
              }}
            >
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange("dateOfBirth")}
                required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  max: new Date().toISOString().split("T")[0],
                  min: new Date(new Date().getFullYear() - 100, 0, 1)
                    .toISOString()
                    .split("T")[0],
                }}
              />
              <TextField
                fullWidth
                label="Age"
                type="number"
                value={formData.age}
                onChange={handleInputChange("age")}
                required
                variant="outlined"
                inputProps={{ min: 18, max: 100 }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 3,
              }}
            >
              <TextField
                fullWidth
                label="Monthly Income (Optional)"
                type="number"
                value={formData.income}
                onChange={handleInputChange("income")}
                variant="outlined"
                placeholder="₹"
              />
              <TextField
                fullWidth
                label="Pincode"
                value={formData.pincode}
                onChange={handleInputChange("pincode")}
                required
                variant="outlined"
                placeholder="6-digit pincode"
              />
            </Box>

            {/* Employment Information */}
            <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 1 }}>
              Employment Information
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 3,
              }}
            >
              <FormControl fullWidth required>
                <InputLabel>Employment Status</InputLabel>
                <Select
                  value={formData.employmentStatus}
                  label="Employment Status"
                  onChange={handleSelectChange("employmentStatus")}
                >
                  <MenuItem value="employed">Employed</MenuItem>
                  <MenuItem value="unemployed">Unemployed</MenuItem>
                </Select>
                <FormHelperText>
                  Please select your current employment status
                </FormHelperText>
              </FormControl>

              {formData.employmentStatus === "employed" && (
                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.companyName}
                  onChange={handleInputChange("companyName")}
                  required
                  variant="outlined"
                  placeholder="Enter your company name"
                />
              )}
            </Box>

            {/* Terms and Conditions */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.acceptTerms}
                  onChange={handleCheckboxChange}
                  color="primary"
                />
              }
              label="I accept the terms and conditions and privacy policy"
              sx={{ mt: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{ mt: 2 }}
            >
              {submitting
                ? "Submitting..."
                : "Submit & Continue to Application"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default function SharedProductForm() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="sm" sx={{ mt: 4 }}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <CircularProgress />
          </Box>
        </Container>
      }
    >
      <SharedProductFormContent />
    </Suspense>
  );
}
