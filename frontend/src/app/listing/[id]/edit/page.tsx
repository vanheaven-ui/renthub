import ListingForm from "@/components/ListingForm";
import { getListingById } from "@/lib/api";

const EditListingPage = async ({ params }: { params: { id: string } }) => {
  const listing = await getListingById(params.id);

  return <ListingForm initialData={listing} />;
};

export default EditListingPage;
