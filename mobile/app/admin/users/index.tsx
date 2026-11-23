import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import type { User } from "@/lib/types";
import { api } from "../../../src/api";
import { NavRow } from "../../../src/admin-ui";
import { useLoad } from "../../../src/data";
import { colors } from "../../../src/theme";
import { Badge, Empty, Input, Loading, Message, Screen } from "../../../src/ui";

type Row = User & { projectCount: number };

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const { data, error, refreshing, onRefresh } = useLoad(() => api<Row[]>("/api/admin/users"), "admin-users");
  if (!data && !error) return <Loading />;
  const term = search.trim().toLowerCase();
  const rows = (data ?? []).filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} animate={false}>
      {error ? <Message text={error} /> : null}
      <Input value={search} onChangeText={setSearch} placeholder="Search by name or email" autoCapitalize="none" autoCorrect={false} />
      {rows.length === 0 ? <Empty text="No users found." /> : null}
      {rows.map((u) => (
        <NavRow
          key={u.id}
          label={u.name}
          hint={`${u.email} · ${u.projectCount === 1 ? "1 project" : `${u.projectCount} projects`}`}
          onPress={() => router.push(`/admin/users/${u.id}`)}
          right={
            <View style={{ gap: 4, alignItems: "flex-end" }}>
              {u.isAdmin ? <Badge label="Admin" bg={colors.brandSoft} fg={colors.brandStrong} /> : null}
              {u.disabledAt ? <Badge label="Disabled" bg={colors.criticalSoft} fg={colors.critical} /> : null}
              {!u.emailVerifiedAt ? <Badge label="Unverified" bg={colors.field} fg={colors.muted} /> : null}
            </View>
          }
        />
      ))}
    </Screen>
  );
}
