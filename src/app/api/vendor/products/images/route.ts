import { apiError, apiOk, validationError } from "@/lib/api-response";
import { uploadProductImage } from "@/lib/r2";
import { getCurrentVendorProfile } from "@/server/vendor-service";

export async function POST(request: Request) {
  try {
    const profile = await getCurrentVendorProfile();

    if ("authRequired" in profile) {
      return apiError("Vendor authentication required.", 401);
    }

    if ("missingProfile" in profile) {
      return apiError("Create a vendor profile before uploading product images.", 409);
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return apiError("Product image file is required.", 400);
    }

    const image = await uploadProductImage(file, profile.id);

    return apiOk({ image }, { status: 201 });
  } catch (error) {
    return validationError(error);
  }
}
