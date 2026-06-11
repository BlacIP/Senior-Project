import { apiError, apiOk, validationError } from "@/lib/api-response";
import {
  createVendorProfile,
  getVendorDashboard,
  updateVendorProfile,
} from "@/server/vendor-service";

export async function GET() {
  const dashboard = await getVendorDashboard();

  if (!dashboard) {
    return apiError("Vendor authentication required.", 401);
  }

  return apiOk(dashboard);
}

export async function POST(request: Request) {
  try {
    const profile = await createVendorProfile(await request.json());

    if (!profile) {
      return apiError("Vendor authentication required.", 401);
    }

    return apiOk({ profile }, { status: 201 });
  } catch (error) {
    return validationError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const profile = await updateVendorProfile(await request.json());

    if (!profile) {
      return apiError("Vendor authentication required.", 401);
    }

    if ("missingProfile" in profile) {
      return apiError("Create a vendor profile before updating it.", 409);
    }

    return apiOk({ profile });
  } catch (error) {
    return validationError(error);
  }
}
