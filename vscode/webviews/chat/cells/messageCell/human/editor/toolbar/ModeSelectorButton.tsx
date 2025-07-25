import type { ChatMessage } from '@sourcegraph/cody-shared'
import { isMacOS } from '@sourcegraph/cody-shared'
import { MessageSquare, Pencil, Sparkle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '../../../../../../components/shadcn/ui/badge'
import { Command, CommandItem, CommandList } from '../../../../../../components/shadcn/ui/command'
import { ToolbarPopoverItem } from '../../../../../../components/shadcn/ui/toolbar'
import { cn } from '../../../../../../components/shadcn/utils'
import { useConfig } from '../../../../../../utils/useConfig'

const isMac = isMacOS()

export enum IntentEnum {
    Agentic = 'Agent',
    Chat = 'Chat',
    Search = 'Search', // Deprecated, kept for compatibility
    Edit = 'Edit',
    Insert = 'Insert',
}

// Mapping between ChatMessage intent and IntentEnum for faster lookups
export const INTENT_MAPPING: Record<NonNullable<ChatMessage['intent']>, IntentEnum> = {
    agentic: IntentEnum.Agentic,
    chat: IntentEnum.Chat,
    search: IntentEnum.Search, // Deprecated, kept for compatibility
    edit: IntentEnum.Edit,
    insert: IntentEnum.Insert,
}

interface IntentOption {
    title: string
    icon: React.FC<{ className?: string }>
    intent: NonNullable<ChatMessage['intent']>
    badge?: string
    hidden?: boolean
    disabled?: boolean
    agent?: string
    value: IntentEnum
}

export const ModeSelectorField: React.FunctionComponent<{
    isDotComUser: boolean
    isCodyProUser: boolean
    _intent: ChatMessage['intent']
    className?: string
    manuallySelectIntent: (intent?: ChatMessage['intent']) => void
}> = ({ className, _intent = 'chat', manuallySelectIntent }) => {
    const {
        clientCapabilities: { edit },
        config,
    } = useConfig()

    // Generate intent options based on current configuration
    const intentOptions = useMemo(() => {
        const isEditEnabled = edit !== 'none'
        const agenticChatEnabled = !!config?.experimentalAgenticChatEnabled

        return [
            {
                title: 'Chat',
                icon: MessageSquare,
                intent: 'chat',
                value: IntentEnum.Chat,
            },
            {
                title: 'Edit',
                icon: Pencil,
                intent: 'edit',
                hidden: !isEditEnabled,
                disabled: !isEditEnabled,
                value: IntentEnum.Edit,
            },
            {
                title: 'Agent',
                badge: agenticChatEnabled ? 'Experimental' : 'Pro',
                icon: Sparkle,
                intent: 'agentic',
                // Hide agentic option if not enabled or if edit not enabled
                hidden: !agenticChatEnabled || !isEditEnabled,
                disabled: !agenticChatEnabled || !isEditEnabled,
                value: IntentEnum.Agentic,
            },
        ].filter(option => !option.hidden) as IntentOption[]
    }, [edit, config?.experimentalAgenticChatEnabled])

    // Get available (non-disabled) options
    const availableOptions = useMemo(
        () => intentOptions.filter(option => !option.disabled),
        [intentOptions]
    )

    // Initialize with the provided intent or fallback to chat
    const [currentSelectedIntent, setCurrentSelectedIntent] = useState(() => {
        const mappedIntent = INTENT_MAPPING[_intent || 'chat']
        // For agentic intent, check if the feature flag is enabled
        if (_intent === 'agentic' && !config?.experimentalAgenticChatEnabled) {
            return IntentEnum.Chat
        }
        // Check if the intent is available and not disabled
        const isValidIntent = intentOptions.some(
            option => option.value === mappedIntent && !option.disabled
        )
        return isValidIntent ? mappedIntent : IntentEnum.Chat
    })

    // Handle intent selection
    const handleSelectIntent = useCallback(
        (intent: ChatMessage['intent'], close?: () => void) => {
            manuallySelectIntent(intent)
            setCurrentSelectedIntent(INTENT_MAPPING[intent || 'chat'] || IntentEnum.Chat)
            close?.()
        },
        [manuallySelectIntent]
    )

    // Handle keyboard shortcut
    useEffect(() => {
        // Only enable shortcut if there are multiple available options
        if (availableOptions.length <= 1) return

        // If intent is agentic but feature flag is off, fallback to Chat
        if (_intent === 'agentic' && !config?.experimentalAgenticChatEnabled) {
            if (currentSelectedIntent !== IntentEnum.Chat) {
                setCurrentSelectedIntent(IntentEnum.Chat)
            }
            return
        }

        if (INTENT_MAPPING[_intent || 'chat'] !== currentSelectedIntent) {
            setCurrentSelectedIntent(INTENT_MAPPING[_intent || 'chat'] || IntentEnum.Chat)
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if ((isMac ? event.metaKey : event.ctrlKey) && event.key === '.') {
                event.preventDefault()

                // Find current index in available options
                const currentIndex = availableOptions.findIndex(
                    option => option.value === currentSelectedIntent
                )

                // Select next option in the list
                const nextIndex = (currentIndex + 1) % availableOptions.length
                handleSelectIntent(availableOptions[nextIndex].intent)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [
        availableOptions,
        currentSelectedIntent,
        handleSelectIntent,
        _intent,
        config?.experimentalAgenticChatEnabled,
    ])

    return (
        <ToolbarPopoverItem
            role="combobox"
            iconEnd="chevron"
            className={cn('tw-justify-between', className)}
            tooltip={`Switch mode (${isMac ? '⌘.' : 'Ctrl.'})`}
            aria-label="switch-mode"
            popoverContent={close => (
                <div className="tw-flex tw-flex-col tw-max-h-[500px] tw-overflow-auto">
                    <Command>
                        <CommandList className="tw-p-2">
                            {intentOptions.map(option => (
                                <CommandItem
                                    key={option.intent}
                                    onSelect={() => handleSelectIntent(option.intent, close)}
                                    disabled={option.disabled}
                                    className="tw-flex tw-text-left tw-justify-between tw-rounded-sm tw-cursor-pointer tw-px-4"
                                >
                                    <div className="tw-flex tw-gap-4">
                                        <option.icon className="tw-size-8 tw-mt-1" />
                                        {option.title}
                                    </div>
                                    {option.badge && <Badge>{option.badge}</Badge>}
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>
                </div>
            )}
            popoverContentProps={{
                className: 'tw-min-w-[200px] tw-w-[30vw] tw-max-w-[300px] !tw-p-0',
                onCloseAutoFocus: event => {
                    event.preventDefault()
                },
            }}
        >
            {currentSelectedIntent}
        </ToolbarPopoverItem>
    )
}
