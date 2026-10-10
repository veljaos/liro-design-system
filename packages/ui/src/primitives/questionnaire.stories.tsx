import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import {
  Questionnaire,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireTitle,
} from './questionnaire'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/Questionnaire',
  parameters: {
    docs: {
      description: {
        component: internal(
          'The shadcn/ui Questionnaire (radix-vega, fetched 2026-10-08) on @shadcn/react 0.3.1: a ' +
            'question as a fieldset with its legend, choices as radio buttons or checkboxes with ' +
            'their number keys, the error. Questionnaire (P5.1) is built from it.',
        ),
      },
    },
  },
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** One question: the number keys choose (the key at the end of each option). */
export const Single: Story = {
  render: function Render() {
    const [value, setValue] = useState('office')
    return (
      <Questionnaire shortcuts="numbers" item="place" className="max-w-120">
        <QuestionnaireItem name="place">
          <QuestionnaireTitle>Where will the employee work?</QuestionnaireTitle>
          <QuestionnaireDescription>Written into the contract.</QuestionnaireDescription>
          <QuestionnaireChoices>
            {[
              { value: 'office', label: 'Office, Novi Sad' },
              { value: 'remote', label: 'Remote' },
              { value: 'hybrid', label: 'Hybrid', description: 'Some days in the office' },
            ].map((option) => (
              <QuestionnaireChoice
                key={option.value}
                value={option.value}
                checked={value === option.value}
                onChange={() => {
                  setValue(option.value)
                }}
              >
                <span>{option.label}</span>
                {option.description !== undefined && (
                  <QuestionnaireChoiceDescription>
                    {option.description}
                  </QuestionnaireChoiceDescription>
                )}
              </QuestionnaireChoice>
            ))}
          </QuestionnaireChoices>
        </QuestionnaireItem>
      </Questionnaire>
    )
  },
  play: async () => {
    await settle()
  },
}

export const SingleInteraction: Story = {
  name: 'Single, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [value, setValue] = useState('office')
    return (
      <Questionnaire shortcuts="numbers" item="place" className="max-w-120">
        <QuestionnaireItem name="place">
          <QuestionnaireTitle>Where will the employee work?</QuestionnaireTitle>
          <QuestionnaireDescription>Written into the contract.</QuestionnaireDescription>
          <QuestionnaireChoices>
            {[
              { value: 'office', label: 'Office, Novi Sad' },
              { value: 'remote', label: 'Remote' },
              { value: 'hybrid', label: 'Hybrid', description: 'Some days in the office' },
            ].map((option) => (
              <QuestionnaireChoice
                key={option.value}
                value={option.value}
                checked={value === option.value}
                onChange={() => {
                  setValue(option.value)
                }}
              >
                <span>{option.label}</span>
                {option.description !== undefined && (
                  <QuestionnaireChoiceDescription>
                    {option.description}
                  </QuestionnaireChoiceDescription>
                )}
              </QuestionnaireChoice>
            ))}
          </QuestionnaireChoices>
        </QuestionnaireItem>
      </Questionnaire>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: 'Office, Novi Sad' }))
    await userEvent.keyboard('3')
    await expect(canvas.getByRole('radio', { name: /Hybrid/ })).toBeChecked()
    await settle()
  },
}

/** Several choices, one disabled, and the error look. */
export const MultipleInvalid: Story = {
  name: 'Multiple, invalid',
  render: () => (
    <Questionnaire shortcuts="numbers" item="equipment" className="max-w-120">
      <QuestionnaireItem name="equipment" multiple required invalid>
        <QuestionnaireTitle>Which equipment is needed?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="laptop">Laptop</QuestionnaireChoice>
          <QuestionnaireChoice value="phone">Company phone</QuestionnaireChoice>
          <QuestionnaireChoice value="car" disabled>
            Company car
          </QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError>Choose at least one.</QuestionnaireError>
      </QuestionnaireItem>
    </Questionnaire>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: 'Company car' })).toBeDisabled()
    await expect(canvas.getByText('Choose at least one.')).toBeVisible()
  },
}
