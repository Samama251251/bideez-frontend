import { Badge } from "@/components/ui/badge"
import type { CompanyMember } from "@/lib/api/types"

export function CompanyMembersTable({ members }: { members: CompanyMember[] }) {
  if (members.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        No team members found.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Email</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Speciality</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Role</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-border last:border-0">
              <td className="px-4 py-2 font-medium">{member.name}</td>
              <td className="px-4 py-2 text-muted-foreground">{member.email}</td>
              <td className="px-4 py-2 text-muted-foreground">{member.department ?? "—"}</td>
              <td className="px-4 py-2">
                <Badge variant={member.role === "owner" ? "default" : "outline"}>
                  {member.role}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
