/** Trusted extension policies are rendered on every request, outside editable prompt versions. */
export class SourcePromptSections {
  private readonly sections = new Map<string, () => string>()
  register(name: string, render: () => string): () => void {
    if (!/^[a-z][a-z0-9:._-]{0,127}$/.test(name) || this.sections.has(name)) throw new Error('Invalid or duplicate source prompt section')
    this.sections.set(name, render)
    return () => { if (this.sections.get(name) === render) this.sections.delete(name) }
  }
  render(): string {
    return [...this.sections].map(([name, render]) => {
      const text = render() // Throw rather than silently omit a required policy on a provider failure.
      if (typeof text !== 'string' || !text.trim()) throw new Error(`Source prompt section unavailable: ${name}`)
      return `## Authenticated source policy: ${name}\n${text}`
    }).join('\n\n')
  }
}
