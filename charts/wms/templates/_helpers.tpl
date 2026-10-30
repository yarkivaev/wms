{{- define "wms.labels" -}}
app.kubernetes.io/name: wms
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}
