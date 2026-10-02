import { LiroProvider } from '@veljaos/ui'
import { FormTextField } from '@veljaos/ui/form'
import { useForm } from 'react-hook-form'

interface Customer {
  name: string
}

/**
 * One field bound with React Hook Form through the `@veljaos/ui/form` subpath, typed against the
 * packed declarations: `name` must be a key of the form's values.
 */
export function FormExample() {
  const { control, handleSubmit } = useForm<Customer>({ defaultValues: { name: 'Alfa Trade' } })
  return (
    <LiroProvider locale="en">
      <form
        onSubmit={(event) => {
          void handleSubmit(() => undefined)(event)
        }}
      >
        <FormTextField
          control={control}
          name="name"
          label="Name"
          rules={{ required: 'Enter the name.' }}
        />
      </form>
    </LiroProvider>
  )
}
