import { PhotoDetailScreen } from "@/components/photo/PhotoDetailScreen";

export default async function PhotoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PhotoDetailScreen photoId={id} />;
}
