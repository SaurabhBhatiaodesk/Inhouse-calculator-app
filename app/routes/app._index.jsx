import { json } from "@remix-run/node";
import {
  Form,
  FormLayout,
  TextField,
  Button,
  Page,
  BlockStack,
  Layout,
  Card,
  Banner,
  Select,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useCallback, useState } from "react";
import { useSubmit, useActionData, useLoaderData } from "@remix-run/react";
import db from "../db.server";
export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const { session } = admin.rest;
    const { shop } = session;
    const existingDynamicCalculatorPrice =
      await db.unitsOfMeasurementDB.findFirst({
        where: { shop: shop },
      });

    return json({
      statusCode: 200,
      success: true,
      message: "Data Fetch successfully",
      data: existingDynamicCalculatorPrice,
    });
  } catch (error) {
    return json({
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    });
  }
};

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const { session } = admin.rest;
    const { shop } = session;

    const formData = await request.formData();
    const body = Object.fromEntries(formData.entries());

    let { UnitsOfMeasurement, UnitsOfMeasurementPrice } = body || {};

    let updatedData;

    if (shop) {
      let existingDynamicCalculatorPrice =
        await db.unitsOfMeasurementDB.findFirst({
          where: { shop },
        });

      if (existingDynamicCalculatorPrice) {
        await db.unitsOfMeasurementDB.updateMany({
          where: {
            shop: existingDynamicCalculatorPrice.shop,
          },
          data: {
            UnitsOfMeasurement,
            UnitsOfMeasurementPrice,
          },
        });
      } else {
        updatedData = await db.unitsOfMeasurementDB.create({
          data: {
            shop,
            UnitsOfMeasurement,
            UnitsOfMeasurementPrice,
          },
        });
      }
    }

    return json({
      statusCode: 200,
      success: true,
      message: "Data updated successfully",
      data: updatedData,
    });
  } catch (error) {
    console.error("Error in action:", error);
    return json({
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    });
  }
};

const Index = () => {
  const submit = useSubmit();
  const loaderData = useLoaderData();
  const actionData = useActionData();

  let { UnitsOfMeasurement, UnitsOfMeasurementPrice } = loaderData.data || {};

  console.log(loaderData);

  const [validationMessage, setValidationMessage] = useState("");
  const [showBanner, setShowBanner] = useState(false);
  const [bannerStatus, setBannerStatus] = useState("info");

  const [formData, setFormData] = useState({
    UnitsOfMeasurement: UnitsOfMeasurement || "uom",
    UnitsOfMeasurementPrice: UnitsOfMeasurementPrice || "",
  });

  const options = [
    { label: "select Units Of Measurement", value: "uom" },
    { label: "Centimeters (cm)", value: "Centimeters (cm)" },
    { label: "Meters (m)", value: "Meters (m)" },
    { label: "Millimeters (mm)", value: "Millimeters (mm)" },
    { label: "Inches (in)", value: "Inches (in)" },
    { label: "Feet (ft)", value: "Feet (ft)" },
  ];

  const handleTextChange = useCallback(
    (name, value) =>
      setFormData((prevData) => ({ ...prevData, [name]: value })),
    [],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        // Simulate validation logic (replace with actual validation logic)
        if (!formData.UnitsOfMeasurement || !formData.UnitsOfMeasurementPrice) {
          setValidationMessage("Please fill out all fields.");
          setShowBanner(true);
          setBannerStatus("critical");
          return;
        }

        //Submit data
        const data = new FormData();
        for (const [key, value] of Object.entries(formData)) {
          data.append(key, value);
        }
        submit(data, { method: "post" });

        // Handle response based on success or failure
        if (actionData && actionData.success) {
          setValidationMessage("Form submitted successfully.");
          setShowBanner(true);
          setBannerStatus("success");
        } else {
          setValidationMessage("Failed to submit form. Please try again.");
          setBannerStatus("critical");
          setShowBanner(true);
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        setValidationMessage("An unexpected error occurred.");
        setBannerStatus("critical");
        setShowBanner(true);
      }
    },
    [formData, submit, actionData],
  );

  // Dismiss the banner
  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setValidationMessage("");
  }, []);

  return (
    <Page>
      <TitleBar title="Double Glazed Unit" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <Form onSubmit={handleSubmit}>
                <FormLayout>
                  <Select
                    label="Units Of Measurement"
                    options={options}
                    onChange={(value) =>
                      handleTextChange("UnitsOfMeasurement", value)
                    }
                    value={formData.UnitsOfMeasurement}
                  />

                  <TextField
                    label="Units Of Measurement Price"
                    value={formData.UnitsOfMeasurementPrice}
                    onChange={(value) =>
                      handleTextChange("UnitsOfMeasurementPrice", value)
                    }
                    placeholder="Units Of Measurement Price"
                    type="number"
                    name="UnitsOfMeasurementPrice"
                    disabled={formData.UnitsOfMeasurement === "uom"}
                  />

                  {/* Validation Banner */}
                  {showBanner && (
                    <Banner
                      title={validationMessage}
                      tone={bannerStatus}
                      onDismiss={handleDismiss}
                    />
                  )}

                  <Button submit>Submit</Button>
                </FormLayout>
              </Form>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
};

export default Index;
