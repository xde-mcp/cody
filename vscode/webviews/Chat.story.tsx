import { type DefaultContext, FIXTURE_MODELS } from '@sourcegraph/cody-shared'
import { ExtensionAPIProviderForTestsOnly, MOCK_API } from '@sourcegraph/prompt-editor'
import type { Meta, StoryObj } from '@storybook/react'
import { Observable } from 'observable-fns'
import { Chat } from './Chat'
import { FIXTURE_TRANSCRIPT } from './chat/fixtures'
import { FIXTURE_COMMANDS, makePromptsAPIWithData } from './components/promptList/fixtures'
import { VSCodeWebview } from './storybook/VSCodeStoryDecorator'
import { MockNoGuardrails } from './utils/guardrails'

const meta: Meta<typeof Chat> = {
    title: 'cody/Chat',
    component: Chat,

    argTypes: {
        transcript: {
            name: 'Transcript fixture',
            options: Object.keys(FIXTURE_TRANSCRIPT),
            mapping: FIXTURE_TRANSCRIPT,
            control: { type: 'select' },
            models: FIXTURE_MODELS,
        },
    },
    args: {
        transcript: FIXTURE_TRANSCRIPT.simple2,
        messageInProgress: null,
        chatEnabled: true,
        chatCodeHighlightingEnabled: true,
        vscodeAPI: {
            postMessage: () => {},
            onMessage: () => () => {},
        },
        setView: () => {},
        models: FIXTURE_MODELS,
        guardrails: new MockNoGuardrails(),
    } satisfies React.ComponentProps<typeof Chat>,

    decorators: [VSCodeWebview],
}

export default meta

export const Default: StoryObj<typeof meta> = {}

export const Empty: StoryObj<typeof meta> = { args: { transcript: [] } }

export const EmptyWithPromptLibraryUnsupported: StoryObj<typeof meta> = {
    args: { transcript: [] },
    render: args => (
        <ExtensionAPIProviderForTestsOnly
            value={{
                ...MOCK_API,
                userHistory: () => Observable.of(null),
                defaultContext: () =>
                    Observable.of<DefaultContext>({ initialContext: [], corpusContext: [] }),
                prompts: makePromptsAPIWithData({
                    arePromptsSupported: false,
                    prompts: [],
                    commands: FIXTURE_COMMANDS,
                }),
                evaluatedFeatureFlag: _flag => Observable.of(true),
            }}
        >
            <Chat {...args} />
        </ExtensionAPIProviderForTestsOnly>
    ),
}

export const EmptyWithNoPrompts: StoryObj<typeof meta> = {
    args: { transcript: [] },
    render: args => (
        <ExtensionAPIProviderForTestsOnly
            value={{
                ...MOCK_API,
                userHistory: () => Observable.of(null),
                defaultContext: () =>
                    Observable.of<DefaultContext>({ initialContext: [], corpusContext: [] }),
                prompts: makePromptsAPIWithData({
                    prompts: [],
                    commands: FIXTURE_COMMANDS,
                }),
                evaluatedFeatureFlag: _flag => Observable.of(true),
            }}
        >
            <Chat {...args} />
        </ExtensionAPIProviderForTestsOnly>
    ),
}

export const Disabled: StoryObj<typeof meta> = { args: { chatEnabled: false } }
