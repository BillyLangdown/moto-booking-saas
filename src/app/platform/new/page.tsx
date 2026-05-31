import NewBusinessForm from '@/components/platform/NewBusinessForm'

export default function NewBusinessPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold text-ink">Add new business</h1>
        <p className="text-sm text-secondary mt-0.5">
          Set up a new organisation and their admin login in one go.
        </p>
      </div>
      <NewBusinessForm />
    </div>
  )
}
