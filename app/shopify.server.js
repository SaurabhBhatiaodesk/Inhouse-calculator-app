import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-04";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.April24,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      //Retrieve shop  in session
      const accessDynamicallyShop = session.shop;
      //Retrieve accessToken  in session
      const accessDynamicallyAccessToken = session.accessToken;

      shopify.registerWebhooks({ session });

        //call function of cart-transform shopify
        await makeCartTransformCreate(
          accessDynamicallyShop,
          accessDynamicallyAccessToken
        );
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.April24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

//create  cart-transform shopify
async function makeCartTransformCreate(
  accessDynamicallyShop,
  accessDynamicallyAccessToken,
) {
  console.log(accessDynamicallyShop, "accessDynamicallyShop");
  console.log(accessDynamicallyAccessToken, "accessDynamicallyAccessToken");

  var myHeaders = new Headers();
  myHeaders.append("X-Shopify-Access-Token", accessDynamicallyAccessToken);
  myHeaders.append("Content-Type", "application/json");

  var graphql = JSON.stringify({
    query:
      "mutation cartTransformCreate($functionId: String!) {\r\n  cartTransformCreate(functionId: $functionId) {\r\n    cartTransform {\r\n      id\r\n    }\r\n    userErrors {\r\n      field\r\n      message\r\n    }\r\n  }\r\n}\r\n\r\n\r\n",
    variables: { functionId: "3794eae1-e267-4b32-b65b-60b195802791" },
  });
  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: graphql,
    redirect: "follow",
  };

  try {
    fetch(
      `https://${accessDynamicallyShop}/admin/api/2024-01/graphql.json`,
      requestOptions,
    )
      .then((response) => response.json())
      .then((result) => console.log(result, "fetching"))
      .catch((error) => console.log("Error in fetch:", error));
  } catch (error) {
    console.log("Caught an exception:", error);
  }
}
