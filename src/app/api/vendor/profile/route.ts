import { apiError, apiOk, validationError } from "@/lib/api-response";
import {
  createVendorProfile,
  getVendorDashboard,
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
