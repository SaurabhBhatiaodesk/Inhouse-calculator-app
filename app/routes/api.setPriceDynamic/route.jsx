import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const existingDynamicCalculatorPrice =
      await db.unitsOfMeasurementDB.findFirst({
        where: { shop: shop },
      });

    return cors(
      request,
      json({
        statusCode: 200,
        success: true,
        message: "Data Fetch successfully",
        data: existingDynamicCalculatorPrice,
      }),
    );
  } catch (error) {
    return cors(
      request,
      json({
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Internal server error",
        }),
      }),
    );
  }
}
