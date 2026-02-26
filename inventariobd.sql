--
-- PostgreSQL database dump
--

\restrict t9XAHkBzrEXmPpZXAcLmPMjW0jGyfmWfe9ISif4UamkoetZ52QJSsWBF2QlnC4m

-- Dumped from database version 16.11 (Postgres.app)
-- Dumped by pg_dump version 16.11 (Postgres.app)

-- Started on 2026-02-24 10:24:15 -03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4148 (class 1262 OID 5)
-- Name: postgres; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = icu LOCALE = 'en_US.UTF-8' ICU_LOCALE = 'en-US';


ALTER DATABASE postgres OWNER TO postgres;

\unrestrict t9XAHkBzrEXmPpZXAcLmPMjW0jGyfmWfe9ISif4UamkoetZ52QJSsWBF2QlnC4m
\connect postgres
\restrict t9XAHkBzrEXmPpZXAcLmPMjW0jGyfmWfe9ISif4UamkoetZ52QJSsWBF2QlnC4m

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4149 (class 0 OID 0)
-- Dependencies: 4148
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- TOC entry 2 (class 3079 OID 16390)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 4150 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 332 (class 1255 OID 16933)
-- Name: fn_auditoria(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_auditoria() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO log_auditoria_general
  (tabla_afectada, tipo_operacion, fecha_hora_operacion, exito)
  VALUES
  (TG_TABLE_NAME, TG_OP, now(), true);
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_auditoria() OWNER TO postgres;

--
-- TOC entry 331 (class 1255 OID 16931)
-- Name: fn_bloquear_usuario(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_bloquear_usuario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.intentos_fallidos >= 5 THEN
    NEW.bloqueado := true;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_bloquear_usuario() OWNER TO postgres;

--
-- TOC entry 327 (class 1255 OID 16923)
-- Name: fn_calcular_garantia(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_calcular_garantia() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.fecha_compra IS NOT NULL AND NEW.garantia_meses IS NOT NULL THEN
    NEW.fecha_fin_garantia :=
      NEW.fecha_compra + (NEW.garantia_meses || ' months')::interval;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_calcular_garantia() OWNER TO postgres;

--
-- TOC entry 330 (class 1255 OID 16929)
-- Name: fn_equipo_baja(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_equipo_baja() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.fecha_aprobacion_baja IS NOT NULL THEN
    UPDATE equipo
    SET activo = false,
        codigo_estado = 5
    WHERE id_equipo = NEW.id_equipo;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_equipo_baja() OWNER TO postgres;

--
-- TOC entry 329 (class 1255 OID 16927)
-- Name: fn_equipo_liberado(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_equipo_liberado() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.fecha_devolucion IS NOT NULL THEN
    UPDATE equipo
    SET codigo_estado = 1
    WHERE id_equipo = NEW.id_equipo;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_equipo_liberado() OWNER TO postgres;

--
-- TOC entry 328 (class 1255 OID 16925)
-- Name: fn_equipo_ocupado(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_equipo_ocupado() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE equipo
  SET codigo_estado = 2
  WHERE id_equipo = NEW.id_equipo;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_equipo_ocupado() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 259 (class 1259 OID 16700)
-- Name: asignacion_equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asignacion_equipo (
    id_asignacion integer NOT NULL,
    id_equipo integer,
    id_funcionario integer,
    fecha_asignacion date,
    fecha_devolucion date,
    motivo_asignacion text,
    estado_equipo_entrega character varying(100),
    estado_equipo_devolucion character varying(100),
    acta_entrega character varying(255),
    acta_devolucion character varying(255),
    observaciones_entrega text,
    observaciones_devolucion text,
    estado_asignacion character varying(50),
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    creado_por integer,
    actualizado_por integer,
    fecha_actualizacion timestamp without time zone
);


ALTER TABLE public.asignacion_equipo OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 16699)
-- Name: asignacion_equipo_id_asignacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.asignacion_equipo ALTER COLUMN id_asignacion ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.asignacion_equipo_id_asignacion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 279 (class 1259 OID 16961)
-- Name: auth_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO postgres;

--
-- TOC entry 278 (class 1259 OID 16960)
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 281 (class 1259 OID 16969)
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO postgres;

--
-- TOC entry 280 (class 1259 OID 16968)
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 277 (class 1259 OID 16955)
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO postgres;

--
-- TOC entry 276 (class 1259 OID 16954)
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 283 (class 1259 OID 16975)
-- Name: auth_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.auth_user OWNER TO postgres;

--
-- TOC entry 285 (class 1259 OID 16983)
-- Name: auth_user_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_user_groups OWNER TO postgres;

--
-- TOC entry 284 (class 1259 OID 16982)
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 282 (class 1259 OID 16974)
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 287 (class 1259 OID 16989)
-- Name: auth_user_user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_user_user_permissions OWNER TO postgres;

--
-- TOC entry 286 (class 1259 OID 16988)
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 267 (class 1259 OID 16843)
-- Name: baja_equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.baja_equipo (
    id_baja integer NOT NULL,
    id_equipo integer,
    fecha_solicitud_baja date,
    fecha_aprobacion_baja date,
    fecha_baja_efectiva date,
    motivo_baja text,
    tipo_baja character varying(100),
    id_funcionario_solicita integer,
    id_funcionario_aprueba integer,
    valor_libro numeric(12,2),
    valor_recuperado numeric(12,2),
    destino_final character varying(150),
    empresa_reciclaje character varying(150),
    numero_acta_baja character varying(100),
    acta_baja_documento character varying(255),
    certificado_destruccion character varying(255),
    estado_solicitud character varying(100),
    observaciones text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_por integer,
    fecha_actualizacion timestamp without time zone
);


ALTER TABLE public.baja_equipo OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 16842)
-- Name: baja_equipo_id_baja_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.baja_equipo ALTER COLUMN id_baja ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.baja_equipo_id_baja_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 235 (class 1259 OID 16483)
-- Name: cargo_funcionario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cargo_funcionario (
    codigo_cargo integer NOT NULL,
    descripcion character varying(100) NOT NULL,
    nivel_jerarquico integer
);


ALTER TABLE public.cargo_funcionario OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16482)
-- Name: cargo_funcionario_codigo_cargo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.cargo_funcionario ALTER COLUMN codigo_cargo ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cargo_funcionario_codigo_cargo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 229 (class 1259 OID 16464)
-- Name: condicion_equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.condicion_equipo (
    codigo_condicion integer NOT NULL,
    descripcion character varying(100) NOT NULL
);


ALTER TABLE public.condicion_equipo OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16463)
-- Name: condicion_equipo_codigo_condicion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.condicion_equipo ALTER COLUMN codigo_condicion ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.condicion_equipo_codigo_condicion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 289 (class 1259 OID 17047)
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO postgres;

--
-- TOC entry 288 (class 1259 OID 17046)
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 275 (class 1259 OID 16947)
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO postgres;

--
-- TOC entry 274 (class 1259 OID 16946)
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 273 (class 1259 OID 16939)
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO postgres;

--
-- TOC entry 272 (class 1259 OID 16938)
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 290 (class 1259 OID 17075)
-- Name: django_session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 16604)
-- Name: equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipo (
    id_equipo integer NOT NULL,
    numero_inventario character varying(50) NOT NULL,
    numero_serie character varying(100) NOT NULL,
    codigo_tipo integer,
    codigo_marca integer,
    modelo character varying(100),
    codigo_ram integer,
    codigo_procesador integer,
    codigo_so integer,
    codigo_disco integer,
    capacidad_disco_gb integer,
    codigo_condicion integer,
    codigo_estado integer,
    id_ubicacion integer,
    fecha_compra date,
    fecha_ingreso_inventario date,
    valor_compra numeric(12,2),
    codigo_tipo_adquisicion integer,
    proveedor character varying(150),
    numero_factura character varying(100),
    garantia_meses integer,
    fecha_fin_garantia date,
    observaciones text,
    imagen_equipo character varying(255),
    codigo_qr character varying(255),
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    creado_por integer,
    actualizado_por integer,
    fecha_actualizacion timestamp without time zone,
    CONSTRAINT chk_garantia CHECK ((garantia_meses >= 0))
);


ALTER TABLE public.equipo OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 16603)
-- Name: equipo_id_equipo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.equipo ALTER COLUMN id_equipo ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.equipo_id_equipo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 257 (class 1259 OID 16678)
-- Name: equipo_monitor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipo_monitor (
    id_equipo_monitor integer NOT NULL,
    id_equipo integer,
    marca_monitor character varying(100),
    modelo_monitor character varying(100),
    pulgadas integer,
    resolucion character varying(50),
    tipo_panel character varying(50),
    numero_serie_monitor character varying(100),
    fecha_asignacion_monitor date,
    observaciones text,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    creado_por integer
);


ALTER TABLE public.equipo_monitor OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 16677)
-- Name: equipo_monitor_id_equipo_monitor_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.equipo_monitor ALTER COLUMN id_equipo_monitor ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.equipo_monitor_id_equipo_monitor_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 231 (class 1259 OID 16470)
-- Name: estado_equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.estado_equipo (
    codigo_estado integer NOT NULL,
    descripcion character varying(100) NOT NULL,
    permite_asignacion boolean DEFAULT true
);


ALTER TABLE public.estado_equipo OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16469)
-- Name: estado_equipo_codigo_estado_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.estado_equipo ALTER COLUMN codigo_estado ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.estado_equipo_codigo_estado_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 241 (class 1259 OID 16501)
-- Name: estado_mantenimiento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.estado_mantenimiento (
    codigo_estado_mantenimiento integer NOT NULL,
    descripcion character varying(100) NOT NULL
);


ALTER TABLE public.estado_mantenimiento OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16500)
-- Name: estado_mantenimiento_codigo_estado_mantenimiento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.estado_mantenimiento ALTER COLUMN codigo_estado_mantenimiento ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.estado_mantenimiento_codigo_estado_mantenimiento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 251 (class 1259 OID 16546)
-- Name: funcionario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.funcionario (
    id_funcionario integer NOT NULL,
    rut character varying(20) NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    email_institucional character varying(150) NOT NULL,
    telefono character varying(30),
    codigo_cargo integer,
    codigo_unidad integer,
    fecha_ingreso date,
    fecha_salida date,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_por integer,
    fecha_actualizacion timestamp without time zone
);


ALTER TABLE public.funcionario OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 16545)
-- Name: funcionario_id_funcionario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.funcionario ALTER COLUMN id_funcionario ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.funcionario_id_funcionario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 261 (class 1259 OID 16730)
-- Name: historial_estado_equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_estado_equipo (
    id_historial_estado integer NOT NULL,
    id_equipo integer,
    codigo_estado_anterior integer,
    codigo_estado_nuevo integer,
    codigo_motivo integer,
    fecha_cambio timestamp without time zone,
    id_funcionario_ejecuta integer,
    motivo_detallado text,
    documentos_respaldo text,
    ip_address character varying(50),
    navegador character varying(100),
    observaciones text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.historial_estado_equipo OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 16729)
-- Name: historial_estado_equipo_id_historial_estado_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.historial_estado_equipo ALTER COLUMN id_historial_estado ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.historial_estado_equipo_id_historial_estado_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 263 (class 1259 OID 16764)
-- Name: historial_ubicacion_equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_ubicacion_equipo (
    id_historial_ubicacion integer NOT NULL,
    id_equipo integer,
    id_ubicacion_anterior integer,
    id_ubicacion_nueva integer,
    fecha_movimiento timestamp without time zone,
    motivo_movimiento text,
    acta_movimiento character varying(255),
    id_funcionario_autoriza integer,
    id_funcionario_ejecuta integer,
    observaciones text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.historial_ubicacion_equipo OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 16763)
-- Name: historial_ubicacion_equipo_id_historial_ubicacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.historial_ubicacion_equipo ALTER COLUMN id_historial_ubicacion ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.historial_ubicacion_equipo_id_historial_ubicacion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 271 (class 1259 OID 16888)
-- Name: log_auditoria_general; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log_auditoria_general (
    id_log integer NOT NULL,
    tabla_afectada character varying(100),
    id_registro_afectado integer,
    tipo_operacion character varying(20),
    datos_anteriores text,
    datos_nuevos text,
    id_usuario_ejecuta integer,
    fecha_hora_operacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(50),
    navegador character varying(100),
    sistema_operativo character varying(100),
    exito boolean,
    mensaje_error text
);


ALTER TABLE public.log_auditoria_general OWNER TO postgres;

--
-- TOC entry 270 (class 1259 OID 16887)
-- Name: log_auditoria_general_id_log_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.log_auditoria_general ALTER COLUMN id_log ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.log_auditoria_general_id_log_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 265 (class 1259 OID 16798)
-- Name: mantenimiento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mantenimiento (
    id_mantenimiento integer NOT NULL,
    id_equipo integer,
    codigo_tipo_mantenimiento integer,
    fecha_solicitud date,
    fecha_ingreso_taller date,
    fecha_salida_taller date,
    fecha_entrega date,
    problema_reportado text,
    diagnostico_tecnico text,
    solucion_aplicada text,
    repuestos_utilizados text,
    costo_repuestos numeric(12,2),
    costo_mano_obra numeric(12,2),
    costo_total numeric(12,2),
    proveedor_servicio character varying(150),
    tecnico_responsable character varying(150),
    numero_orden_trabajo character varying(100),
    numero_factura character varying(100),
    garantia_aplicada boolean DEFAULT false,
    id_funcionario_solicita integer,
    id_funcionario_recibe integer,
    codigo_estado_mantenimiento integer,
    observaciones text,
    documentos_adjuntos text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    creado_por integer,
    actualizado_por integer,
    fecha_actualizacion timestamp without time zone,
    CONSTRAINT chk_fechas_mantenimiento CHECK (((fecha_ingreso_taller IS NULL) OR (fecha_salida_taller IS NULL) OR (fecha_ingreso_taller <= fecha_salida_taller)))
);


ALTER TABLE public.mantenimiento OWNER TO postgres;

--
-- TOC entry 264 (class 1259 OID 16797)
-- Name: mantenimiento_id_mantenimiento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.mantenimiento ALTER COLUMN id_mantenimiento ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mantenimiento_id_mantenimiento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 219 (class 1259 OID 16434)
-- Name: marca; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marca (
    codigo_marca integer NOT NULL,
    descripcion character varying(100) NOT NULL,
    pais_origen character varying(100)
);


ALTER TABLE public.marca OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16433)
-- Name: marca_codigo_marca_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.marca ALTER COLUMN codigo_marca ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.marca_codigo_marca_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 247 (class 1259 OID 16525)
-- Name: motivo_estado_equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.motivo_estado_equipo (
    codigo_motivo integer NOT NULL,
    descripcion character varying(150) NOT NULL
);


ALTER TABLE public.motivo_estado_equipo OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 16524)
-- Name: motivo_estado_equipo_codigo_motivo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.motivo_estado_equipo ALTER COLUMN codigo_motivo ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.motivo_estado_equipo_codigo_motivo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 221 (class 1259 OID 16440)
-- Name: procesador; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.procesador (
    codigo_procesador integer NOT NULL,
    descripcion character varying(150) NOT NULL,
    fabricante character varying(100),
    generacion character varying(50)
);


ALTER TABLE public.procesador OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16439)
-- Name: procesador_codigo_procesador_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.procesador ALTER COLUMN codigo_procesador ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.procesador_codigo_procesador_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 223 (class 1259 OID 16446)
-- Name: ram; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ram (
    codigo_ram integer NOT NULL,
    capacidad_gb integer NOT NULL,
    tipo character varying(50) NOT NULL
);


ALTER TABLE public.ram OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16445)
-- Name: ram_codigo_ram_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.ram ALTER COLUMN codigo_ram ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ram_codigo_ram_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 233 (class 1259 OID 16477)
-- Name: region; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.region (
    codigo_region integer NOT NULL,
    nombre character varying(100) NOT NULL,
    numero_romano character varying(20)
);


ALTER TABLE public.region OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16476)
-- Name: region_codigo_region_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.region ALTER COLUMN codigo_region ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.region_codigo_region_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 269 (class 1259 OID 16874)
-- Name: reporte_generado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reporte_generado (
    id_reporte integer NOT NULL,
    tipo_reporte character varying(100),
    nombre_reporte character varying(150),
    parametros_filtro text,
    formato_exportacion character varying(50),
    ruta_archivo character varying(255),
    cantidad_registros integer,
    fecha_generacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_funcionario_genera integer,
    tiempo_generacion_segundos integer,
    observaciones text
);


ALTER TABLE public.reporte_generado OWNER TO postgres;

--
-- TOC entry 268 (class 1259 OID 16873)
-- Name: reporte_generado_id_reporte_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.reporte_generado ALTER COLUMN id_reporte ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.reporte_generado_id_reporte_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 243 (class 1259 OID 16507)
-- Name: rol_sistema; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rol_sistema (
    codigo_rol integer NOT NULL,
    nombre_rol character varying(50) NOT NULL,
    puede_eliminar boolean DEFAULT false,
    puede_aprobar_bajas boolean DEFAULT false,
    puede_generar_reportes boolean DEFAULT true,
    puede_editar_catalogos boolean DEFAULT false,
    descripcion text
);


ALTER TABLE public.rol_sistema OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 16506)
-- Name: rol_sistema_codigo_rol_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.rol_sistema ALTER COLUMN codigo_rol ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rol_sistema_codigo_rol_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 227 (class 1259 OID 16458)
-- Name: sistema_operativo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sistema_operativo (
    codigo_so integer NOT NULL,
    nombre character varying(100) NOT NULL,
    version character varying(50),
    fabricante character varying(100)
);


ALTER TABLE public.sistema_operativo OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16457)
-- Name: sistema_operativo_codigo_so_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.sistema_operativo ALTER COLUMN codigo_so ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sistema_operativo_codigo_so_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 245 (class 1259 OID 16519)
-- Name: tipo_adquisicion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipo_adquisicion (
    codigo_tipo_adquisicion integer NOT NULL,
    descripcion character varying(100) NOT NULL
);


ALTER TABLE public.tipo_adquisicion OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 16518)
-- Name: tipo_adquisicion_codigo_tipo_adquisicion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tipo_adquisicion ALTER COLUMN codigo_tipo_adquisicion ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tipo_adquisicion_codigo_tipo_adquisicion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 225 (class 1259 OID 16452)
-- Name: tipo_disco; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipo_disco (
    codigo_disco integer NOT NULL,
    descripcion character varying(100) NOT NULL
);


ALTER TABLE public.tipo_disco OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16451)
-- Name: tipo_disco_codigo_disco_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tipo_disco ALTER COLUMN codigo_disco ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tipo_disco_codigo_disco_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 217 (class 1259 OID 16428)
-- Name: tipo_equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipo_equipo (
    codigo_tipo integer NOT NULL,
    descripcion character varying(100) NOT NULL
);


ALTER TABLE public.tipo_equipo OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 16427)
-- Name: tipo_equipo_codigo_tipo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tipo_equipo ALTER COLUMN codigo_tipo ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tipo_equipo_codigo_tipo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 239 (class 1259 OID 16495)
-- Name: tipo_mantenimiento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipo_mantenimiento (
    codigo_tipo_mantenimiento integer NOT NULL,
    descripcion character varying(100) NOT NULL
);


ALTER TABLE public.tipo_mantenimiento OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16494)
-- Name: tipo_mantenimiento_codigo_tipo_mantenimiento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tipo_mantenimiento ALTER COLUMN codigo_tipo_mantenimiento ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tipo_mantenimiento_codigo_tipo_mantenimiento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 249 (class 1259 OID 16531)
-- Name: ubicacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ubicacion (
    id_ubicacion integer NOT NULL,
    codigo_region integer,
    nombre_sede character varying(150) NOT NULL,
    direccion character varying(200),
    piso character varying(20),
    oficina character varying(50),
    descripcion_detallada text,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ubicacion OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 16530)
-- Name: ubicacion_id_ubicacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.ubicacion ALTER COLUMN id_ubicacion ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ubicacion_id_ubicacion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 237 (class 1259 OID 16489)
-- Name: unidad_funcionario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unidad_funcionario (
    codigo_unidad integer NOT NULL,
    descripcion character varying(150) NOT NULL,
    sigla character varying(20)
);


ALTER TABLE public.unidad_funcionario OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16488)
-- Name: unidad_funcionario_codigo_unidad_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.unidad_funcionario ALTER COLUMN codigo_unidad ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.unidad_funcionario_codigo_unidad_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 253 (class 1259 OID 16573)
-- Name: usuario_sistema; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario_sistema (
    id_usuario integer NOT NULL,
    id_funcionario integer,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    codigo_rol integer,
    ultimo_acceso timestamp without time zone,
    intentos_fallidos integer DEFAULT 0,
    bloqueado boolean DEFAULT false,
    token_recuperacion character varying(255),
    fecha_expiracion_token timestamp without time zone,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_por integer,
    fecha_actualizacion timestamp without time zone,
    CONSTRAINT chk_intentos_fallidos CHECK ((intentos_fallidos >= 0))
);


ALTER TABLE public.usuario_sistema OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 16572)
-- Name: usuario_sistema_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.usuario_sistema ALTER COLUMN id_usuario ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuario_sistema_id_usuario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 4111 (class 0 OID 16700)
-- Dependencies: 259
-- Data for Name: asignacion_equipo; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.asignacion_equipo OVERRIDING SYSTEM VALUE VALUES (1, 1, 1, '2026-01-28', '2026-02-02', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'DEVUELTO', false, NULL, NULL, NULL, NULL);
INSERT INTO public.asignacion_equipo OVERRIDING SYSTEM VALUE VALUES (2, 1, 1, '2026-01-28', '2026-02-12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'DEVUELTO', false, NULL, NULL, NULL, NULL);
INSERT INTO public.asignacion_equipo OVERRIDING SYSTEM VALUE VALUES (3, 1, 1, '2026-02-13', '2026-02-13', 'entrega por reemplazo', NULL, NULL, NULL, NULL, NULL, NULL, 'Cerrada', false, NULL, NULL, NULL, NULL);
INSERT INTO public.asignacion_equipo OVERRIDING SYSTEM VALUE VALUES (4, 1, 1, '2026-02-13', '2026-02-13', 'testeo asignaciones', NULL, NULL, NULL, NULL, NULL, NULL, 'Cerrada', false, NULL, NULL, NULL, NULL);
INSERT INTO public.asignacion_equipo OVERRIDING SYSTEM VALUE VALUES (5, 2, 1, '2026-02-16', '2026-02-16', 'testeo 2', NULL, NULL, NULL, NULL, NULL, NULL, 'Cerrada', false, NULL, NULL, NULL, NULL);
INSERT INTO public.asignacion_equipo OVERRIDING SYSTEM VALUE VALUES (6, 1, 1, '2026-02-17', NULL, 'entrega pc', NULL, NULL, NULL, NULL, NULL, NULL, 'Activa', true, NULL, NULL, NULL, NULL);


--
-- TOC entry 4131 (class 0 OID 16961)
-- Dependencies: 279
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.auth_group VALUES (1, 'mop_inventario');


--
-- TOC entry 4133 (class 0 OID 16969)
-- Dependencies: 281
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4129 (class 0 OID 16955)
-- Dependencies: 277
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.auth_permission VALUES (1, 'Can add log entry', 1, 'add_logentry');
INSERT INTO public.auth_permission VALUES (2, 'Can change log entry', 1, 'change_logentry');
INSERT INTO public.auth_permission VALUES (3, 'Can delete log entry', 1, 'delete_logentry');
INSERT INTO public.auth_permission VALUES (4, 'Can view log entry', 1, 'view_logentry');
INSERT INTO public.auth_permission VALUES (5, 'Can add permission', 2, 'add_permission');
INSERT INTO public.auth_permission VALUES (6, 'Can change permission', 2, 'change_permission');
INSERT INTO public.auth_permission VALUES (7, 'Can delete permission', 2, 'delete_permission');
INSERT INTO public.auth_permission VALUES (8, 'Can view permission', 2, 'view_permission');
INSERT INTO public.auth_permission VALUES (9, 'Can add group', 3, 'add_group');
INSERT INTO public.auth_permission VALUES (10, 'Can change group', 3, 'change_group');
INSERT INTO public.auth_permission VALUES (11, 'Can delete group', 3, 'delete_group');
INSERT INTO public.auth_permission VALUES (12, 'Can view group', 3, 'view_group');
INSERT INTO public.auth_permission VALUES (13, 'Can add user', 4, 'add_user');
INSERT INTO public.auth_permission VALUES (14, 'Can change user', 4, 'change_user');
INSERT INTO public.auth_permission VALUES (15, 'Can delete user', 4, 'delete_user');
INSERT INTO public.auth_permission VALUES (16, 'Can view user', 4, 'view_user');
INSERT INTO public.auth_permission VALUES (17, 'Can add content type', 5, 'add_contenttype');
INSERT INTO public.auth_permission VALUES (18, 'Can change content type', 5, 'change_contenttype');
INSERT INTO public.auth_permission VALUES (19, 'Can delete content type', 5, 'delete_contenttype');
INSERT INTO public.auth_permission VALUES (20, 'Can view content type', 5, 'view_contenttype');
INSERT INTO public.auth_permission VALUES (21, 'Can add session', 6, 'add_session');
INSERT INTO public.auth_permission VALUES (22, 'Can change session', 6, 'change_session');
INSERT INTO public.auth_permission VALUES (23, 'Can delete session', 6, 'delete_session');
INSERT INTO public.auth_permission VALUES (24, 'Can view session', 6, 'view_session');


--
-- TOC entry 4135 (class 0 OID 16975)
-- Dependencies: 283
-- Data for Name: auth_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.auth_user VALUES (1, 'pbkdf2_sha256$600000$dN3AeRZ7pUGBLRUDafoiMi$hiG/GqDruvNR33Kkrb4vmSU+VbPycAenmePEJMJtnlc=', '2026-02-10 12:19:28.704406-03', true, 'thomas', '', '', 'thomascorteso@gmail.com', true, true, '2026-01-27 16:14:51-03');
INSERT INTO public.auth_user VALUES (2, 'pbkdf2_sha256$600000$t0hx2seAMfAg6u1FYLMcQx$aiuXoNGrOWxCr1NGm4OhFb2B695zqKer/MyFchFYpjg=', NULL, true, 'inventario', '', '', 'inentario@gmail.com', true, true, '2026-02-10 11:52:04-03');


--
-- TOC entry 4137 (class 0 OID 16983)
-- Dependencies: 285
-- Data for Name: auth_user_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.auth_user_groups VALUES (1, 1, 1);
INSERT INTO public.auth_user_groups VALUES (2, 2, 1);


--
-- TOC entry 4139 (class 0 OID 16989)
-- Dependencies: 287
-- Data for Name: auth_user_user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.auth_user_user_permissions VALUES (1, 2, 1);
INSERT INTO public.auth_user_user_permissions VALUES (2, 2, 2);
INSERT INTO public.auth_user_user_permissions VALUES (3, 2, 3);
INSERT INTO public.auth_user_user_permissions VALUES (4, 2, 4);
INSERT INTO public.auth_user_user_permissions VALUES (5, 2, 5);
INSERT INTO public.auth_user_user_permissions VALUES (6, 2, 6);
INSERT INTO public.auth_user_user_permissions VALUES (7, 2, 7);
INSERT INTO public.auth_user_user_permissions VALUES (8, 2, 8);
INSERT INTO public.auth_user_user_permissions VALUES (9, 2, 9);
INSERT INTO public.auth_user_user_permissions VALUES (10, 2, 10);
INSERT INTO public.auth_user_user_permissions VALUES (11, 2, 11);
INSERT INTO public.auth_user_user_permissions VALUES (12, 2, 12);
INSERT INTO public.auth_user_user_permissions VALUES (13, 2, 13);
INSERT INTO public.auth_user_user_permissions VALUES (14, 2, 14);
INSERT INTO public.auth_user_user_permissions VALUES (15, 2, 15);
INSERT INTO public.auth_user_user_permissions VALUES (16, 2, 16);
INSERT INTO public.auth_user_user_permissions VALUES (17, 2, 17);
INSERT INTO public.auth_user_user_permissions VALUES (18, 2, 18);
INSERT INTO public.auth_user_user_permissions VALUES (19, 2, 19);
INSERT INTO public.auth_user_user_permissions VALUES (20, 2, 20);
INSERT INTO public.auth_user_user_permissions VALUES (21, 2, 21);
INSERT INTO public.auth_user_user_permissions VALUES (22, 2, 22);
INSERT INTO public.auth_user_user_permissions VALUES (23, 2, 23);
INSERT INTO public.auth_user_user_permissions VALUES (24, 2, 24);


--
-- TOC entry 4119 (class 0 OID 16843)
-- Dependencies: 267
-- Data for Name: baja_equipo; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4087 (class 0 OID 16483)
-- Dependencies: 235
-- Data for Name: cargo_funcionario; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.cargo_funcionario OVERRIDING SYSTEM VALUE VALUES (1, 'Administrador TI', 1);
INSERT INTO public.cargo_funcionario OVERRIDING SYSTEM VALUE VALUES (2, 'Administrador TI', 1);


--
-- TOC entry 4081 (class 0 OID 16464)
-- Dependencies: 229
-- Data for Name: condicion_equipo; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.condicion_equipo OVERRIDING SYSTEM VALUE VALUES (1, 'Excelente');


--
-- TOC entry 4141 (class 0 OID 17047)
-- Dependencies: 289
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.django_admin_log VALUES (1, '2026-01-28 12:31:24.489644-03', '1', 'mop_inventario', 1, '[{"added": {}}]', 3, 1);
INSERT INTO public.django_admin_log VALUES (2, '2026-01-28 12:35:08.610455-03', '1', 'thomas', 2, '[{"changed": {"fields": ["Groups"]}}]', 4, 1);
INSERT INTO public.django_admin_log VALUES (3, '2026-02-10 12:20:25.078168-03', '2', 'inventario', 2, '[{"changed": {"fields": ["Groups", "User permissions"]}}]', 4, 1);
INSERT INTO public.django_admin_log VALUES (4, '2026-02-23 10:45:27.397478-03', '2', 'Yungay', 1, '[{"added": {}}]', 9, 1);
INSERT INTO public.django_admin_log VALUES (5, '2026-02-23 10:45:51.155791-03', '3', 'La unioni', 1, '[{"added": {}}]', 9, 1);
INSERT INTO public.django_admin_log VALUES (6, '2026-02-23 10:46:16.347003-03', '4', 'Animas', 1, '[{"added": {}}]', 9, 1);


--
-- TOC entry 4127 (class 0 OID 16947)
-- Dependencies: 275
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.django_content_type VALUES (1, 'admin', 'logentry');
INSERT INTO public.django_content_type VALUES (2, 'auth', 'permission');
INSERT INTO public.django_content_type VALUES (3, 'auth', 'group');
INSERT INTO public.django_content_type VALUES (4, 'auth', 'user');
INSERT INTO public.django_content_type VALUES (5, 'contenttypes', 'contenttype');
INSERT INTO public.django_content_type VALUES (6, 'sessions', 'session');
INSERT INTO public.django_content_type VALUES (7, 'core', 'funcionario');
INSERT INTO public.django_content_type VALUES (8, 'core', 'asignacionequipo');
INSERT INTO public.django_content_type VALUES (9, 'core', 'ubicacion');
INSERT INTO public.django_content_type VALUES (10, 'core', 'equipo');


--
-- TOC entry 4125 (class 0 OID 16939)
-- Dependencies: 273
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.django_migrations VALUES (1, 'contenttypes', '0001_initial', '2026-01-27 16:14:00.391263-03');
INSERT INTO public.django_migrations VALUES (2, 'auth', '0001_initial', '2026-01-27 16:14:00.68591-03');
INSERT INTO public.django_migrations VALUES (3, 'admin', '0001_initial', '2026-01-27 16:14:00.733041-03');
INSERT INTO public.django_migrations VALUES (4, 'admin', '0002_logentry_remove_auto_add', '2026-01-27 16:14:00.75368-03');
INSERT INTO public.django_migrations VALUES (5, 'admin', '0003_logentry_add_action_flag_choices', '2026-01-27 16:14:00.769775-03');
INSERT INTO public.django_migrations VALUES (6, 'contenttypes', '0002_remove_content_type_name', '2026-01-27 16:14:00.807984-03');
INSERT INTO public.django_migrations VALUES (7, 'auth', '0002_alter_permission_name_max_length', '2026-01-27 16:14:00.821277-03');
INSERT INTO public.django_migrations VALUES (8, 'auth', '0003_alter_user_email_max_length', '2026-01-27 16:14:00.836504-03');
INSERT INTO public.django_migrations VALUES (9, 'auth', '0004_alter_user_username_opts', '2026-01-27 16:14:00.848364-03');
INSERT INTO public.django_migrations VALUES (10, 'auth', '0005_alter_user_last_login_null', '2026-01-27 16:14:00.863537-03');
INSERT INTO public.django_migrations VALUES (11, 'auth', '0006_require_contenttypes_0002', '2026-01-27 16:14:00.867938-03');
INSERT INTO public.django_migrations VALUES (12, 'auth', '0007_alter_validators_add_error_messages', '2026-01-27 16:14:00.880452-03');
INSERT INTO public.django_migrations VALUES (13, 'auth', '0008_alter_user_username_max_length', '2026-01-27 16:14:00.910691-03');
INSERT INTO public.django_migrations VALUES (14, 'auth', '0009_alter_user_last_name_max_length', '2026-01-27 16:14:01.018043-03');
INSERT INTO public.django_migrations VALUES (15, 'auth', '0010_alter_group_name_max_length', '2026-01-27 16:14:01.031769-03');
INSERT INTO public.django_migrations VALUES (16, 'auth', '0011_update_proxy_permissions', '2026-01-27 16:14:01.043149-03');
INSERT INTO public.django_migrations VALUES (17, 'auth', '0012_alter_user_first_name_max_length', '2026-01-27 16:14:01.057443-03');
INSERT INTO public.django_migrations VALUES (18, 'sessions', '0001_initial', '2026-01-27 16:14:01.077162-03');


--
-- TOC entry 4142 (class 0 OID 17075)
-- Dependencies: 290
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.django_session VALUES ('mvswqz1jfawvdri2mr16106opzhahzye', '.eJxVjDsOwyAQBe9CHaFlLcCkTJ8zoF0-wUkEkrErK3ePLblI2pl5bxOe1qX4tafZT1FchRKXX8YUXqkeIj6pPpoMrS7zxPJI5Gm7vLeY3rez_Tso1Mu-5pERwTIQoeWBlUlG4-CUZWuU23mwAFqBy5F14qQBDWLIajRBZxSfL8zqN1A:1vppWS:u8XFZIUS06G-FFNl6QbV3LuxeD0FnzomJnTB8Zt_JQw', '2026-02-24 12:19:28.713785-03');


--
-- TOC entry 4107 (class 0 OID 16604)
-- Dependencies: 255
-- Data for Name: equipo; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.equipo OVERRIDING SYSTEM VALUE VALUES (2, 'testeo-1', '1234', 1, 1, 'lenovo', NULL, NULL, NULL, NULL, NULL, NULL, 1, 4, '2026-02-04', NULL, NULL, NULL, 'vialidad yungay', '12344213', 12, '2027-02-04', 'testeo creacion equipo', NULL, NULL, true, NULL, NULL, NULL, NULL);
INSERT INTO public.equipo OVERRIDING SYSTEM VALUE VALUES (1, 'INV-001', 'SERIE-001', 1, 1, 'Thinkpad T14', 1, 1, 1, 1, 512, 1, 2, 2, '2024-01-01', NULL, 950000.00, 1, NULL, NULL, 12, '2025-01-01', 'pc de testeo inventario', NULL, NULL, true, '2026-01-26 09:36:47.155157', 1, NULL, NULL);


--
-- TOC entry 4109 (class 0 OID 16678)
-- Dependencies: 257
-- Data for Name: equipo_monitor; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4083 (class 0 OID 16470)
-- Dependencies: 231
-- Data for Name: estado_equipo; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.estado_equipo OVERRIDING SYSTEM VALUE VALUES (1, 'Libre', true);
INSERT INTO public.estado_equipo OVERRIDING SYSTEM VALUE VALUES (2, 'Ocupado', false);
INSERT INTO public.estado_equipo OVERRIDING SYSTEM VALUE VALUES (3, 'Baja', false);


--
-- TOC entry 4093 (class 0 OID 16501)
-- Dependencies: 241
-- Data for Name: estado_mantenimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.estado_mantenimiento OVERRIDING SYSTEM VALUE VALUES (1, 'Pendiente');
INSERT INTO public.estado_mantenimiento OVERRIDING SYSTEM VALUE VALUES (2, 'En taller');
INSERT INTO public.estado_mantenimiento OVERRIDING SYSTEM VALUE VALUES (3, 'Terminado');
INSERT INTO public.estado_mantenimiento OVERRIDING SYSTEM VALUE VALUES (4, 'Entregado');
INSERT INTO public.estado_mantenimiento OVERRIDING SYSTEM VALUE VALUES (5, 'Cancelado');


--
-- TOC entry 4103 (class 0 OID 16546)
-- Dependencies: 251
-- Data for Name: funcionario; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.funcionario OVERRIDING SYSTEM VALUE VALUES (1, '12.345.678-9', 'Bryam Admin', 'bryam@mop.cl', '', NULL, NULL, NULL, NULL, true, '2026-01-26 09:36:47.155157', NULL, NULL);


--
-- TOC entry 4113 (class 0 OID 16730)
-- Dependencies: 261
-- Data for Name: historial_estado_equipo; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.historial_estado_equipo OVERRIDING SYSTEM VALUE VALUES (1, 1, 1, 2, NULL, '2026-02-02 13:08:14.636632', NULL, 'Cambio automático por flujo Asignación/Devolución (backend)', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.historial_estado_equipo OVERRIDING SYSTEM VALUE VALUES (2, 1, 2, 1, NULL, '2026-02-03 15:50:38.48941', NULL, 'Cambio automático por flujo Asignación/Devolución (backend)', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.historial_estado_equipo OVERRIDING SYSTEM VALUE VALUES (3, 1, 1, 2, NULL, '2026-02-13 14:34:02.10901', NULL, 'Cambio automático por flujo Asignación/Devolución (backend)', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.historial_estado_equipo OVERRIDING SYSTEM VALUE VALUES (4, 1, 2, 1, NULL, '2026-02-13 14:34:21.732157', NULL, 'Cambio automático por flujo Asignación/Devolución (backend)', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.historial_estado_equipo OVERRIDING SYSTEM VALUE VALUES (5, 1, 1, 2, NULL, '2026-02-13 15:02:52.466975', NULL, 'Asignación: testeo asignaciones', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.historial_estado_equipo OVERRIDING SYSTEM VALUE VALUES (6, 1, 2, 1, NULL, '2026-02-13 15:02:58.744709', NULL, 'Devolución: equipo devuelto/cierre de asignación.', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.historial_estado_equipo OVERRIDING SYSTEM VALUE VALUES (7, 2, 1, 2, NULL, '2026-02-16 13:44:36.557519', NULL, 'Asignación: testeo 2', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.historial_estado_equipo OVERRIDING SYSTEM VALUE VALUES (8, 2, 2, 1, NULL, '2026-02-16 15:49:25.606226', NULL, 'Devolución: Equipo devuelto / cierre de asignación.', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.historial_estado_equipo OVERRIDING SYSTEM VALUE VALUES (9, 1, 1, 2, NULL, '2026-02-17 14:45:03.262374', NULL, 'Asignación: entrega pc', NULL, NULL, NULL, NULL, NULL);


--
-- TOC entry 4115 (class 0 OID 16764)
-- Dependencies: 263
-- Data for Name: historial_ubicacion_equipo; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4123 (class 0 OID 16888)
-- Dependencies: 271
-- Data for Name: log_auditoria_general; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (1, 'equipo', NULL, 'INSERT', NULL, NULL, NULL, '2026-01-26 09:36:47.155157', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (2, 'asignacion_equipo', NULL, 'INSERT', NULL, NULL, NULL, '2026-01-28 18:46:27.990337', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (3, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-01-28 18:46:27.990337', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (4, 'asignacion_equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-01-28 18:57:06.773346', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (5, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-01-28 18:57:06.773346', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (6, 'asignacion_equipo', NULL, 'INSERT', NULL, NULL, NULL, '2026-02-02 13:08:14.566474', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (7, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-02 13:08:14.566474', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (8, 'asignacion_equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-03 15:50:38.453596', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (9, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-03 15:50:38.453596', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (10, 'asignacion_equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-12 18:13:35.37756', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (11, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-12 18:13:35.37756', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (12, 'asignacion_equipo', NULL, 'INSERT', NULL, NULL, NULL, '2026-02-13 14:34:02.076844', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (13, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 14:34:02.076844', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (14, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 14:34:02.205085', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (15, 'asignacion_equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 14:34:21.720526', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (16, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 14:34:21.720526', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (17, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 14:34:21.840038', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (18, 'asignacion_equipo', NULL, 'INSERT', NULL, NULL, NULL, '2026-02-13 15:02:52.435008', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (19, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 15:02:52.435008', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (20, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 15:02:52.463618', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (21, 'asignacion_equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 15:02:58.730871', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (22, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 15:02:58.730871', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (23, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 15:02:58.740485', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (24, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 15:40:50.470178', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (25, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 15:40:58.36205', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (26, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 15:41:19.629907', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (27, 'equipo', NULL, 'INSERT', NULL, NULL, NULL, '2026-02-13 18:02:17.747942', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (28, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-13 18:23:00.981264', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (29, 'asignacion_equipo', NULL, 'INSERT', NULL, NULL, NULL, '2026-02-16 13:44:36.433433', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (30, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-16 13:44:36.433433', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (31, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-16 13:44:36.553342', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (32, 'mantenimiento', NULL, 'INSERT', NULL, NULL, NULL, '2026-02-16 15:37:21.396181', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (33, 'asignacion_equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-16 15:49:25.585301', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (34, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-16 15:49:25.585301', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (35, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-16 15:49:25.602342', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (36, 'mantenimiento', NULL, 'INSERT', NULL, NULL, NULL, '2026-02-17 12:30:04.481157', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (37, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 12:30:44.166097', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (38, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 12:31:15.28004', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (39, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 12:31:30.202834', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (40, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 12:43:19.871251', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (41, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 12:43:31.61393', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (42, 'mantenimiento', NULL, 'INSERT', NULL, NULL, NULL, '2026-02-17 12:59:10.978798', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (43, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 12:59:10.99233', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (44, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 12:59:19.42875', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (45, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 12:59:26.025281', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (46, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 12:59:33.19941', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (47, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 12:59:45.948197', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (48, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 12:59:50.847342', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (49, 'mantenimiento', NULL, 'INSERT', NULL, NULL, NULL, '2026-02-17 13:00:54.839138', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (50, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 13:00:54.846518', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (51, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 13:01:04.657929', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (52, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 13:01:11.42774', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (53, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 13:51:01.669136', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (54, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 13:51:22.394943', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (55, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 13:51:22.401736', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (56, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 13:51:50.367073', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (57, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 13:51:50.375145', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (58, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 14:29:41.491723', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (59, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 14:29:47.316608', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (60, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 14:29:51.442414', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (61, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 14:30:00.022452', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (62, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 14:30:00.028945', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (63, 'asignacion_equipo', NULL, 'INSERT', NULL, NULL, NULL, '2026-02-17 14:45:03.20766', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (64, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 14:45:03.20766', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (65, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 14:45:03.258749', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (66, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 15:16:48.879674', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (67, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-17 15:16:48.895066', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (68, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 13:26:43.061069', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (69, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 13:26:52.397463', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (70, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 13:26:52.465943', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (71, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 13:27:03.225414', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (72, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 13:27:03.23238', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (73, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 13:27:10.724872', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (74, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 13:27:10.742887', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (75, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 13:53:51.195116', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (76, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 14:07:54.040679', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (77, 'equipo', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 14:09:03.091878', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (78, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 19:54:13.659266', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (79, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 19:54:21.384452', NULL, NULL, NULL, true, NULL);
INSERT INTO public.log_auditoria_general OVERRIDING SYSTEM VALUE VALUES (80, 'mantenimiento', NULL, 'UPDATE', NULL, NULL, NULL, '2026-02-23 19:54:21.391578', NULL, NULL, NULL, true, NULL);


--
-- TOC entry 4117 (class 0 OID 16798)
-- Dependencies: 265
-- Data for Name: mantenimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.mantenimiento OVERRIDING SYSTEM VALUE VALUES (2, 1, 3, '2026-02-17', '2026-02-23', NULL, NULL, 'testeo 3', 'diagnoticando testeo', 'que funcione el backend', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 'probando testeo numero 100 jjaaj', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.mantenimiento OVERRIDING SYSTEM VALUE VALUES (1, 2, 4, '2026-02-16', '2026-02-23', NULL, NULL, 'testeo', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 'testeo', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.mantenimiento OVERRIDING SYSTEM VALUE VALUES (3, 1, 2, '2026-02-17', '2026-02-23', '2026-02-23', '2026-02-23', 'testeo estados', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4, '', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.mantenimiento OVERRIDING SYSTEM VALUE VALUES (4, 2, 3, '2026-02-17', '2026-02-23', NULL, NULL, 'asd', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, '', NULL, NULL, NULL, NULL, NULL);


--
-- TOC entry 4071 (class 0 OID 16434)
-- Dependencies: 219
-- Data for Name: marca; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.marca OVERRIDING SYSTEM VALUE VALUES (1, 'Lenovo', 'China');


--
-- TOC entry 4099 (class 0 OID 16525)
-- Dependencies: 247
-- Data for Name: motivo_estado_equipo; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4073 (class 0 OID 16440)
-- Dependencies: 221
-- Data for Name: procesador; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.procesador OVERRIDING SYSTEM VALUE VALUES (1, 'Intel i5', 'Intel', '11th Gen');


--
-- TOC entry 4075 (class 0 OID 16446)
-- Dependencies: 223
-- Data for Name: ram; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.ram OVERRIDING SYSTEM VALUE VALUES (1, 16, 'DDR4');


--
-- TOC entry 4085 (class 0 OID 16477)
-- Dependencies: 233
-- Data for Name: region; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.region OVERRIDING SYSTEM VALUE VALUES (1, 'Los Ríos', 'XIV');


--
-- TOC entry 4121 (class 0 OID 16874)
-- Dependencies: 269
-- Data for Name: reporte_generado; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4095 (class 0 OID 16507)
-- Dependencies: 243
-- Data for Name: rol_sistema; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.rol_sistema OVERRIDING SYSTEM VALUE VALUES (1, 'Administrador', false, false, true, false, NULL);


--
-- TOC entry 4079 (class 0 OID 16458)
-- Dependencies: 227
-- Data for Name: sistema_operativo; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.sistema_operativo OVERRIDING SYSTEM VALUE VALUES (1, 'Windows', '11', 'Microsoft');


--
-- TOC entry 4097 (class 0 OID 16519)
-- Dependencies: 245
-- Data for Name: tipo_adquisicion; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tipo_adquisicion OVERRIDING SYSTEM VALUE VALUES (1, 'Compra Directa');


--
-- TOC entry 4077 (class 0 OID 16452)
-- Dependencies: 225
-- Data for Name: tipo_disco; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tipo_disco OVERRIDING SYSTEM VALUE VALUES (1, 'SSD');


--
-- TOC entry 4069 (class 0 OID 16428)
-- Dependencies: 217
-- Data for Name: tipo_equipo; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tipo_equipo OVERRIDING SYSTEM VALUE VALUES (1, 'Laptop');


--
-- TOC entry 4091 (class 0 OID 16495)
-- Dependencies: 239
-- Data for Name: tipo_mantenimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tipo_mantenimiento OVERRIDING SYSTEM VALUE VALUES (1, 'Preventivo');
INSERT INTO public.tipo_mantenimiento OVERRIDING SYSTEM VALUE VALUES (2, 'Correctivo');
INSERT INTO public.tipo_mantenimiento OVERRIDING SYSTEM VALUE VALUES (3, 'Diagnóstico');
INSERT INTO public.tipo_mantenimiento OVERRIDING SYSTEM VALUE VALUES (4, 'Garantía');
INSERT INTO public.tipo_mantenimiento OVERRIDING SYSTEM VALUE VALUES (5, 'Actualización de software');
INSERT INTO public.tipo_mantenimiento OVERRIDING SYSTEM VALUE VALUES (6, 'Limpieza técnica');


--
-- TOC entry 4101 (class 0 OID 16531)
-- Dependencies: 249
-- Data for Name: ubicacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.ubicacion OVERRIDING SYSTEM VALUE VALUES (1, 1, 'MOP Valdivia', 'Av. Prat 123', NULL, NULL, NULL, true, '2026-01-26 09:36:47.155157');
INSERT INTO public.ubicacion OVERRIDING SYSTEM VALUE VALUES (2, 1, 'Yungay', 'oficinas yungay MOP', NULL, NULL, '', true, NULL);
INSERT INTO public.ubicacion OVERRIDING SYSTEM VALUE VALUES (3, 1, 'La unioni', 'Oficinas la union', NULL, NULL, '', true, NULL);
INSERT INTO public.ubicacion OVERRIDING SYSTEM VALUE VALUES (4, 1, 'Animas', 'Oficinas las animas MOP', NULL, NULL, '', true, NULL);


--
-- TOC entry 4089 (class 0 OID 16489)
-- Dependencies: 237
-- Data for Name: unidad_funcionario; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.unidad_funcionario OVERRIDING SYSTEM VALUE VALUES (1, 'Informática', 'TI');
INSERT INTO public.unidad_funcionario OVERRIDING SYSTEM VALUE VALUES (2, 'Informática', 'TI');


--
-- TOC entry 4105 (class 0 OID 16573)
-- Dependencies: 253
-- Data for Name: usuario_sistema; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.usuario_sistema OVERRIDING SYSTEM VALUE VALUES (1, 1, 'bryam', '$2a$06$mbbhfZNnNMcLgGjvGFPBZOvmgSc.ZGYQjEu0gVh0.1k/VW5Kmm.pu', 1, NULL, 0, false, NULL, NULL, true, '2026-01-26 09:36:47.155157', NULL, NULL);


--
-- TOC entry 4151 (class 0 OID 0)
-- Dependencies: 258
-- Name: asignacion_equipo_id_asignacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.asignacion_equipo_id_asignacion_seq', 6, true);


--
-- TOC entry 4152 (class 0 OID 0)
-- Dependencies: 278
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, true);


--
-- TOC entry 4153 (class 0 OID 0)
-- Dependencies: 280
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- TOC entry 4154 (class 0 OID 0)
-- Dependencies: 276
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 24, true);


--
-- TOC entry 4155 (class 0 OID 0)
-- Dependencies: 284
-- Name: auth_user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_groups_id_seq', 2, true);


--
-- TOC entry 4156 (class 0 OID 0)
-- Dependencies: 282
-- Name: auth_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_id_seq', 2, true);


--
-- TOC entry 4157 (class 0 OID 0)
-- Dependencies: 286
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_user_permissions_id_seq', 24, true);


--
-- TOC entry 4158 (class 0 OID 0)
-- Dependencies: 266
-- Name: baja_equipo_id_baja_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.baja_equipo_id_baja_seq', 1, false);


--
-- TOC entry 4159 (class 0 OID 0)
-- Dependencies: 234
-- Name: cargo_funcionario_codigo_cargo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cargo_funcionario_codigo_cargo_seq', 2, true);


--
-- TOC entry 4160 (class 0 OID 0)
-- Dependencies: 228
-- Name: condicion_equipo_codigo_condicion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.condicion_equipo_codigo_condicion_seq', 1, true);


--
-- TOC entry 4161 (class 0 OID 0)
-- Dependencies: 288
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 6, true);


--
-- TOC entry 4162 (class 0 OID 0)
-- Dependencies: 274
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 10, true);


--
-- TOC entry 4163 (class 0 OID 0)
-- Dependencies: 272
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 18, true);


--
-- TOC entry 4164 (class 0 OID 0)
-- Dependencies: 254
-- Name: equipo_id_equipo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.equipo_id_equipo_seq', 2, true);


--
-- TOC entry 4165 (class 0 OID 0)
-- Dependencies: 256
-- Name: equipo_monitor_id_equipo_monitor_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.equipo_monitor_id_equipo_monitor_seq', 1, false);


--
-- TOC entry 4166 (class 0 OID 0)
-- Dependencies: 230
-- Name: estado_equipo_codigo_estado_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estado_equipo_codigo_estado_seq', 3, true);


--
-- TOC entry 4167 (class 0 OID 0)
-- Dependencies: 240
-- Name: estado_mantenimiento_codigo_estado_mantenimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estado_mantenimiento_codigo_estado_mantenimiento_seq', 5, true);


--
-- TOC entry 4168 (class 0 OID 0)
-- Dependencies: 250
-- Name: funcionario_id_funcionario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.funcionario_id_funcionario_seq', 1, true);


--
-- TOC entry 4169 (class 0 OID 0)
-- Dependencies: 260
-- Name: historial_estado_equipo_id_historial_estado_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historial_estado_equipo_id_historial_estado_seq', 9, true);


--
-- TOC entry 4170 (class 0 OID 0)
-- Dependencies: 262
-- Name: historial_ubicacion_equipo_id_historial_ubicacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historial_ubicacion_equipo_id_historial_ubicacion_seq', 1, false);


--
-- TOC entry 4171 (class 0 OID 0)
-- Dependencies: 270
-- Name: log_auditoria_general_id_log_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.log_auditoria_general_id_log_seq', 80, true);


--
-- TOC entry 4172 (class 0 OID 0)
-- Dependencies: 264
-- Name: mantenimiento_id_mantenimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mantenimiento_id_mantenimiento_seq', 4, true);


--
-- TOC entry 4173 (class 0 OID 0)
-- Dependencies: 218
-- Name: marca_codigo_marca_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.marca_codigo_marca_seq', 1, true);


--
-- TOC entry 4174 (class 0 OID 0)
-- Dependencies: 246
-- Name: motivo_estado_equipo_codigo_motivo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.motivo_estado_equipo_codigo_motivo_seq', 1, false);


--
-- TOC entry 4175 (class 0 OID 0)
-- Dependencies: 220
-- Name: procesador_codigo_procesador_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.procesador_codigo_procesador_seq', 1, true);


--
-- TOC entry 4176 (class 0 OID 0)
-- Dependencies: 222
-- Name: ram_codigo_ram_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ram_codigo_ram_seq', 1, true);


--
-- TOC entry 4177 (class 0 OID 0)
-- Dependencies: 232
-- Name: region_codigo_region_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.region_codigo_region_seq', 1, true);


--
-- TOC entry 4178 (class 0 OID 0)
-- Dependencies: 268
-- Name: reporte_generado_id_reporte_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reporte_generado_id_reporte_seq', 1, false);


--
-- TOC entry 4179 (class 0 OID 0)
-- Dependencies: 242
-- Name: rol_sistema_codigo_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rol_sistema_codigo_rol_seq', 1, true);


--
-- TOC entry 4180 (class 0 OID 0)
-- Dependencies: 226
-- Name: sistema_operativo_codigo_so_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sistema_operativo_codigo_so_seq', 1, true);


--
-- TOC entry 4181 (class 0 OID 0)
-- Dependencies: 244
-- Name: tipo_adquisicion_codigo_tipo_adquisicion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_adquisicion_codigo_tipo_adquisicion_seq', 1, true);


--
-- TOC entry 4182 (class 0 OID 0)
-- Dependencies: 224
-- Name: tipo_disco_codigo_disco_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_disco_codigo_disco_seq', 1, true);


--
-- TOC entry 4183 (class 0 OID 0)
-- Dependencies: 216
-- Name: tipo_equipo_codigo_tipo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_equipo_codigo_tipo_seq', 1, true);


--
-- TOC entry 4184 (class 0 OID 0)
-- Dependencies: 238
-- Name: tipo_mantenimiento_codigo_tipo_mantenimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_mantenimiento_codigo_tipo_mantenimiento_seq', 6, true);


--
-- TOC entry 4185 (class 0 OID 0)
-- Dependencies: 248
-- Name: ubicacion_id_ubicacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ubicacion_id_ubicacion_seq', 4, true);


--
-- TOC entry 4186 (class 0 OID 0)
-- Dependencies: 236
-- Name: unidad_funcionario_codigo_unidad_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unidad_funcionario_codigo_unidad_seq', 2, true);


--
-- TOC entry 4187 (class 0 OID 0)
-- Dependencies: 252
-- Name: usuario_sistema_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuario_sistema_id_usuario_seq', 1, true);


--
-- TOC entry 3787 (class 2606 OID 16708)
-- Name: asignacion_equipo asignacion_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacion_equipo
    ADD CONSTRAINT asignacion_equipo_pkey PRIMARY KEY (id_asignacion);


--
-- TOC entry 3826 (class 2606 OID 17073)
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- TOC entry 3831 (class 2606 OID 17004)
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- TOC entry 3834 (class 2606 OID 16973)
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3828 (class 2606 OID 16965)
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- TOC entry 3821 (class 2606 OID 16995)
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- TOC entry 3823 (class 2606 OID 16959)
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- TOC entry 3842 (class 2606 OID 16987)
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- TOC entry 3845 (class 2606 OID 17019)
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- TOC entry 3836 (class 2606 OID 16979)
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- TOC entry 3848 (class 2606 OID 16993)
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3851 (class 2606 OID 17033)
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- TOC entry 3839 (class 2606 OID 17068)
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- TOC entry 3802 (class 2606 OID 16852)
-- Name: baja_equipo baja_equipo_id_equipo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baja_equipo
    ADD CONSTRAINT baja_equipo_id_equipo_key UNIQUE (id_equipo);


--
-- TOC entry 3804 (class 2606 OID 16850)
-- Name: baja_equipo baja_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baja_equipo
    ADD CONSTRAINT baja_equipo_pkey PRIMARY KEY (id_baja);


--
-- TOC entry 3741 (class 2606 OID 16487)
-- Name: cargo_funcionario cargo_funcionario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargo_funcionario
    ADD CONSTRAINT cargo_funcionario_pkey PRIMARY KEY (codigo_cargo);


--
-- TOC entry 3735 (class 2606 OID 16468)
-- Name: condicion_equipo condicion_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.condicion_equipo
    ADD CONSTRAINT condicion_equipo_pkey PRIMARY KEY (codigo_condicion);


--
-- TOC entry 3854 (class 2606 OID 17054)
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- TOC entry 3816 (class 2606 OID 16953)
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- TOC entry 3818 (class 2606 OID 16951)
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- TOC entry 3814 (class 2606 OID 16945)
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3858 (class 2606 OID 17081)
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- TOC entry 3783 (class 2606 OID 16688)
-- Name: equipo_monitor equipo_monitor_numero_serie_monitor_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo_monitor
    ADD CONSTRAINT equipo_monitor_numero_serie_monitor_key UNIQUE (numero_serie_monitor);


--
-- TOC entry 3785 (class 2606 OID 16686)
-- Name: equipo_monitor equipo_monitor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo_monitor
    ADD CONSTRAINT equipo_monitor_pkey PRIMARY KEY (id_equipo_monitor);


--
-- TOC entry 3772 (class 2606 OID 16614)
-- Name: equipo equipo_numero_inventario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_numero_inventario_key UNIQUE (numero_inventario);


--
-- TOC entry 3774 (class 2606 OID 16616)
-- Name: equipo equipo_numero_serie_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_numero_serie_key UNIQUE (numero_serie);


--
-- TOC entry 3776 (class 2606 OID 16612)
-- Name: equipo equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_pkey PRIMARY KEY (id_equipo);


--
-- TOC entry 3737 (class 2606 OID 16475)
-- Name: estado_equipo estado_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estado_equipo
    ADD CONSTRAINT estado_equipo_pkey PRIMARY KEY (codigo_estado);


--
-- TOC entry 3747 (class 2606 OID 16505)
-- Name: estado_mantenimiento estado_mantenimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estado_mantenimiento
    ADD CONSTRAINT estado_mantenimiento_pkey PRIMARY KEY (codigo_estado_mantenimiento);


--
-- TOC entry 3757 (class 2606 OID 16556)
-- Name: funcionario funcionario_email_institucional_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionario
    ADD CONSTRAINT funcionario_email_institucional_key UNIQUE (email_institucional);


--
-- TOC entry 3759 (class 2606 OID 16552)
-- Name: funcionario funcionario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionario
    ADD CONSTRAINT funcionario_pkey PRIMARY KEY (id_funcionario);


--
-- TOC entry 3761 (class 2606 OID 16554)
-- Name: funcionario funcionario_rut_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionario
    ADD CONSTRAINT funcionario_rut_key UNIQUE (rut);


--
-- TOC entry 3792 (class 2606 OID 16737)
-- Name: historial_estado_equipo historial_estado_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estado_equipo
    ADD CONSTRAINT historial_estado_equipo_pkey PRIMARY KEY (id_historial_estado);


--
-- TOC entry 3795 (class 2606 OID 16771)
-- Name: historial_ubicacion_equipo historial_ubicacion_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_ubicacion_equipo
    ADD CONSTRAINT historial_ubicacion_equipo_pkey PRIMARY KEY (id_historial_ubicacion);


--
-- TOC entry 3812 (class 2606 OID 16895)
-- Name: log_auditoria_general log_auditoria_general_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_auditoria_general
    ADD CONSTRAINT log_auditoria_general_pkey PRIMARY KEY (id_log);


--
-- TOC entry 3800 (class 2606 OID 16806)
-- Name: mantenimiento mantenimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mantenimiento
    ADD CONSTRAINT mantenimiento_pkey PRIMARY KEY (id_mantenimiento);


--
-- TOC entry 3725 (class 2606 OID 16438)
-- Name: marca marca_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marca
    ADD CONSTRAINT marca_pkey PRIMARY KEY (codigo_marca);


--
-- TOC entry 3753 (class 2606 OID 16529)
-- Name: motivo_estado_equipo motivo_estado_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.motivo_estado_equipo
    ADD CONSTRAINT motivo_estado_equipo_pkey PRIMARY KEY (codigo_motivo);


--
-- TOC entry 3727 (class 2606 OID 16444)
-- Name: procesador procesador_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procesador
    ADD CONSTRAINT procesador_pkey PRIMARY KEY (codigo_procesador);


--
-- TOC entry 3729 (class 2606 OID 16450)
-- Name: ram ram_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ram
    ADD CONSTRAINT ram_pkey PRIMARY KEY (codigo_ram);


--
-- TOC entry 3739 (class 2606 OID 16481)
-- Name: region region_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_pkey PRIMARY KEY (codigo_region);


--
-- TOC entry 3808 (class 2606 OID 16881)
-- Name: reporte_generado reporte_generado_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporte_generado
    ADD CONSTRAINT reporte_generado_pkey PRIMARY KEY (id_reporte);


--
-- TOC entry 3749 (class 2606 OID 16517)
-- Name: rol_sistema rol_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol_sistema
    ADD CONSTRAINT rol_sistema_pkey PRIMARY KEY (codigo_rol);


--
-- TOC entry 3733 (class 2606 OID 16462)
-- Name: sistema_operativo sistema_operativo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sistema_operativo
    ADD CONSTRAINT sistema_operativo_pkey PRIMARY KEY (codigo_so);


--
-- TOC entry 3751 (class 2606 OID 16523)
-- Name: tipo_adquisicion tipo_adquisicion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_adquisicion
    ADD CONSTRAINT tipo_adquisicion_pkey PRIMARY KEY (codigo_tipo_adquisicion);


--
-- TOC entry 3731 (class 2606 OID 16456)
-- Name: tipo_disco tipo_disco_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_disco
    ADD CONSTRAINT tipo_disco_pkey PRIMARY KEY (codigo_disco);


--
-- TOC entry 3723 (class 2606 OID 16432)
-- Name: tipo_equipo tipo_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_equipo
    ADD CONSTRAINT tipo_equipo_pkey PRIMARY KEY (codigo_tipo);


--
-- TOC entry 3745 (class 2606 OID 16499)
-- Name: tipo_mantenimiento tipo_mantenimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_mantenimiento
    ADD CONSTRAINT tipo_mantenimiento_pkey PRIMARY KEY (codigo_tipo_mantenimiento);


--
-- TOC entry 3755 (class 2606 OID 16539)
-- Name: ubicacion ubicacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicacion
    ADD CONSTRAINT ubicacion_pkey PRIMARY KEY (id_ubicacion);


--
-- TOC entry 3743 (class 2606 OID 16493)
-- Name: unidad_funcionario unidad_funcionario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidad_funcionario
    ADD CONSTRAINT unidad_funcionario_pkey PRIMARY KEY (codigo_unidad);


--
-- TOC entry 3766 (class 2606 OID 16585)
-- Name: usuario_sistema usuario_sistema_id_funcionario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_sistema
    ADD CONSTRAINT usuario_sistema_id_funcionario_key UNIQUE (id_funcionario);


--
-- TOC entry 3768 (class 2606 OID 16583)
-- Name: usuario_sistema usuario_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_sistema
    ADD CONSTRAINT usuario_sistema_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 3770 (class 2606 OID 16587)
-- Name: usuario_sistema usuario_sistema_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_sistema
    ADD CONSTRAINT usuario_sistema_username_key UNIQUE (username);


--
-- TOC entry 3824 (class 1259 OID 17074)
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- TOC entry 3829 (class 1259 OID 17015)
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- TOC entry 3832 (class 1259 OID 17016)
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- TOC entry 3819 (class 1259 OID 17001)
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- TOC entry 3840 (class 1259 OID 17031)
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_groups_group_id_97559544 ON public.auth_user_groups USING btree (group_id);


--
-- TOC entry 3843 (class 1259 OID 17030)
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON public.auth_user_groups USING btree (user_id);


--
-- TOC entry 3846 (class 1259 OID 17045)
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON public.auth_user_user_permissions USING btree (permission_id);


--
-- TOC entry 3849 (class 1259 OID 17044)
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON public.auth_user_user_permissions USING btree (user_id);


--
-- TOC entry 3837 (class 1259 OID 17069)
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_username_6821ab7c_like ON public.auth_user USING btree (username varchar_pattern_ops);


--
-- TOC entry 3852 (class 1259 OID 17065)
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- TOC entry 3855 (class 1259 OID 17066)
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- TOC entry 3856 (class 1259 OID 17083)
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- TOC entry 3859 (class 1259 OID 17082)
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- TOC entry 3788 (class 1259 OID 16911)
-- Name: idx_asignacion_activa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asignacion_activa ON public.asignacion_equipo USING btree (activo, fecha_devolucion);


--
-- TOC entry 3789 (class 1259 OID 16909)
-- Name: idx_asignacion_equipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asignacion_equipo ON public.asignacion_equipo USING btree (id_equipo);


--
-- TOC entry 3790 (class 1259 OID 16910)
-- Name: idx_asignacion_funcionario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asignacion_funcionario ON public.asignacion_equipo USING btree (id_funcionario);


--
-- TOC entry 3805 (class 1259 OID 16916)
-- Name: idx_baja_equipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_baja_equipo ON public.baja_equipo USING btree (id_equipo);


--
-- TOC entry 3806 (class 1259 OID 16917)
-- Name: idx_baja_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_baja_estado ON public.baja_equipo USING btree (estado_solicitud);


--
-- TOC entry 3777 (class 1259 OID 16905)
-- Name: idx_equipo_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_equipo_activo ON public.equipo USING btree (activo);


--
-- TOC entry 3778 (class 1259 OID 16903)
-- Name: idx_equipo_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_equipo_estado ON public.equipo USING btree (codigo_estado);


--
-- TOC entry 3779 (class 1259 OID 16901)
-- Name: idx_equipo_numero_inventario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_equipo_numero_inventario ON public.equipo USING btree (numero_inventario);


--
-- TOC entry 3780 (class 1259 OID 16902)
-- Name: idx_equipo_serie; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_equipo_serie ON public.equipo USING btree (numero_serie);


--
-- TOC entry 3781 (class 1259 OID 16904)
-- Name: idx_equipo_ubicacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_equipo_ubicacion ON public.equipo USING btree (id_ubicacion);


--
-- TOC entry 3762 (class 1259 OID 16908)
-- Name: idx_funcionario_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionario_activo ON public.funcionario USING btree (activo);


--
-- TOC entry 3763 (class 1259 OID 16907)
-- Name: idx_funcionario_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionario_email ON public.funcionario USING btree (email_institucional);


--
-- TOC entry 3764 (class 1259 OID 16906)
-- Name: idx_funcionario_rut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionario_rut ON public.funcionario USING btree (rut);


--
-- TOC entry 3793 (class 1259 OID 16912)
-- Name: idx_historial_estado_equipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_estado_equipo ON public.historial_estado_equipo USING btree (id_equipo, fecha_cambio);


--
-- TOC entry 3796 (class 1259 OID 16913)
-- Name: idx_historial_ubicacion_equipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_ubicacion_equipo ON public.historial_ubicacion_equipo USING btree (id_equipo, fecha_movimiento);


--
-- TOC entry 3809 (class 1259 OID 16918)
-- Name: idx_log_tabla_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_tabla_fecha ON public.log_auditoria_general USING btree (tabla_afectada, fecha_hora_operacion);


--
-- TOC entry 3810 (class 1259 OID 16919)
-- Name: idx_log_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_usuario ON public.log_auditoria_general USING btree (id_usuario_ejecuta);


--
-- TOC entry 3797 (class 1259 OID 16914)
-- Name: idx_mantenimiento_equipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mantenimiento_equipo ON public.mantenimiento USING btree (id_equipo);


--
-- TOC entry 3798 (class 1259 OID 16915)
-- Name: idx_mantenimiento_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mantenimiento_estado ON public.mantenimiento USING btree (codigo_estado_mantenimiento);


--
-- TOC entry 3920 (class 2620 OID 16935)
-- Name: asignacion_equipo trg_audit_asignacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_asignacion AFTER INSERT OR DELETE OR UPDATE ON public.asignacion_equipo FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria();


--
-- TOC entry 3918 (class 2620 OID 16934)
-- Name: equipo trg_audit_equipo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_equipo AFTER INSERT OR DELETE OR UPDATE ON public.equipo FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria();


--
-- TOC entry 3923 (class 2620 OID 16936)
-- Name: mantenimiento trg_audit_mantenimiento; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_mantenimiento AFTER INSERT OR DELETE OR UPDATE ON public.mantenimiento FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria();


--
-- TOC entry 3917 (class 2620 OID 16932)
-- Name: usuario_sistema trg_bloquear_usuario; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bloquear_usuario BEFORE UPDATE ON public.usuario_sistema FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_usuario();


--
-- TOC entry 3919 (class 2620 OID 16924)
-- Name: equipo trg_calcular_garantia; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_calcular_garantia BEFORE INSERT ON public.equipo FOR EACH ROW EXECUTE FUNCTION public.fn_calcular_garantia();


--
-- TOC entry 3924 (class 2620 OID 16930)
-- Name: baja_equipo trg_equipo_baja; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_equipo_baja AFTER INSERT ON public.baja_equipo FOR EACH ROW EXECUTE FUNCTION public.fn_equipo_baja();


--
-- TOC entry 3921 (class 2620 OID 16928)
-- Name: asignacion_equipo trg_equipo_liberado; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_equipo_liberado AFTER UPDATE ON public.asignacion_equipo FOR EACH ROW EXECUTE FUNCTION public.fn_equipo_liberado();


--
-- TOC entry 3922 (class 2620 OID 16926)
-- Name: asignacion_equipo trg_equipo_ocupado; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_equipo_ocupado AFTER INSERT ON public.asignacion_equipo FOR EACH ROW EXECUTE FUNCTION public.fn_equipo_ocupado();


--
-- TOC entry 3881 (class 2606 OID 16724)
-- Name: asignacion_equipo asignacion_equipo_actualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacion_equipo
    ADD CONSTRAINT asignacion_equipo_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3882 (class 2606 OID 16719)
-- Name: asignacion_equipo asignacion_equipo_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacion_equipo
    ADD CONSTRAINT asignacion_equipo_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3883 (class 2606 OID 16709)
-- Name: asignacion_equipo asignacion_equipo_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacion_equipo
    ADD CONSTRAINT asignacion_equipo_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.equipo(id_equipo);


--
-- TOC entry 3884 (class 2606 OID 16714)
-- Name: asignacion_equipo asignacion_equipo_id_funcionario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacion_equipo
    ADD CONSTRAINT asignacion_equipo_id_funcionario_fkey FOREIGN KEY (id_funcionario) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3909 (class 2606 OID 17010)
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 3910 (class 2606 OID 17005)
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 3908 (class 2606 OID 16996)
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 3911 (class 2606 OID 17025)
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 3912 (class 2606 OID 17020)
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 3913 (class 2606 OID 17039)
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 3914 (class 2606 OID 17034)
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 3902 (class 2606 OID 16868)
-- Name: baja_equipo baja_equipo_actualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baja_equipo
    ADD CONSTRAINT baja_equipo_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3903 (class 2606 OID 16853)
-- Name: baja_equipo baja_equipo_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baja_equipo
    ADD CONSTRAINT baja_equipo_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.equipo(id_equipo);


--
-- TOC entry 3904 (class 2606 OID 16863)
-- Name: baja_equipo baja_equipo_id_funcionario_aprueba_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baja_equipo
    ADD CONSTRAINT baja_equipo_id_funcionario_aprueba_fkey FOREIGN KEY (id_funcionario_aprueba) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3905 (class 2606 OID 16858)
-- Name: baja_equipo baja_equipo_id_funcionario_solicita_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baja_equipo
    ADD CONSTRAINT baja_equipo_id_funcionario_solicita_fkey FOREIGN KEY (id_funcionario_solicita) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3915 (class 2606 OID 17055)
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 3916 (class 2606 OID 17060)
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 3867 (class 2606 OID 16672)
-- Name: equipo equipo_actualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3868 (class 2606 OID 16647)
-- Name: equipo equipo_codigo_condicion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_codigo_condicion_fkey FOREIGN KEY (codigo_condicion) REFERENCES public.condicion_equipo(codigo_condicion);


--
-- TOC entry 3869 (class 2606 OID 16642)
-- Name: equipo equipo_codigo_disco_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_codigo_disco_fkey FOREIGN KEY (codigo_disco) REFERENCES public.tipo_disco(codigo_disco);


--
-- TOC entry 3870 (class 2606 OID 16652)
-- Name: equipo equipo_codigo_estado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_codigo_estado_fkey FOREIGN KEY (codigo_estado) REFERENCES public.estado_equipo(codigo_estado);


--
-- TOC entry 3871 (class 2606 OID 16622)
-- Name: equipo equipo_codigo_marca_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_codigo_marca_fkey FOREIGN KEY (codigo_marca) REFERENCES public.marca(codigo_marca);


--
-- TOC entry 3872 (class 2606 OID 16632)
-- Name: equipo equipo_codigo_procesador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_codigo_procesador_fkey FOREIGN KEY (codigo_procesador) REFERENCES public.procesador(codigo_procesador);


--
-- TOC entry 3873 (class 2606 OID 16627)
-- Name: equipo equipo_codigo_ram_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_codigo_ram_fkey FOREIGN KEY (codigo_ram) REFERENCES public.ram(codigo_ram);


--
-- TOC entry 3874 (class 2606 OID 16637)
-- Name: equipo equipo_codigo_so_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_codigo_so_fkey FOREIGN KEY (codigo_so) REFERENCES public.sistema_operativo(codigo_so);


--
-- TOC entry 3875 (class 2606 OID 16662)
-- Name: equipo equipo_codigo_tipo_adquisicion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_codigo_tipo_adquisicion_fkey FOREIGN KEY (codigo_tipo_adquisicion) REFERENCES public.tipo_adquisicion(codigo_tipo_adquisicion);


--
-- TOC entry 3876 (class 2606 OID 16617)
-- Name: equipo equipo_codigo_tipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_codigo_tipo_fkey FOREIGN KEY (codigo_tipo) REFERENCES public.tipo_equipo(codigo_tipo);


--
-- TOC entry 3877 (class 2606 OID 16667)
-- Name: equipo equipo_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3878 (class 2606 OID 16657)
-- Name: equipo equipo_id_ubicacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_id_ubicacion_fkey FOREIGN KEY (id_ubicacion) REFERENCES public.ubicacion(id_ubicacion);


--
-- TOC entry 3879 (class 2606 OID 16694)
-- Name: equipo_monitor equipo_monitor_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo_monitor
    ADD CONSTRAINT equipo_monitor_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3880 (class 2606 OID 16689)
-- Name: equipo_monitor equipo_monitor_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo_monitor
    ADD CONSTRAINT equipo_monitor_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.equipo(id_equipo);


--
-- TOC entry 3861 (class 2606 OID 16567)
-- Name: funcionario funcionario_actualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionario
    ADD CONSTRAINT funcionario_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3862 (class 2606 OID 16557)
-- Name: funcionario funcionario_codigo_cargo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionario
    ADD CONSTRAINT funcionario_codigo_cargo_fkey FOREIGN KEY (codigo_cargo) REFERENCES public.cargo_funcionario(codigo_cargo);


--
-- TOC entry 3863 (class 2606 OID 16562)
-- Name: funcionario funcionario_codigo_unidad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionario
    ADD CONSTRAINT funcionario_codigo_unidad_fkey FOREIGN KEY (codigo_unidad) REFERENCES public.unidad_funcionario(codigo_unidad);


--
-- TOC entry 3885 (class 2606 OID 16743)
-- Name: historial_estado_equipo historial_estado_equipo_codigo_estado_anterior_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estado_equipo
    ADD CONSTRAINT historial_estado_equipo_codigo_estado_anterior_fkey FOREIGN KEY (codigo_estado_anterior) REFERENCES public.estado_equipo(codigo_estado);


--
-- TOC entry 3886 (class 2606 OID 16748)
-- Name: historial_estado_equipo historial_estado_equipo_codigo_estado_nuevo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estado_equipo
    ADD CONSTRAINT historial_estado_equipo_codigo_estado_nuevo_fkey FOREIGN KEY (codigo_estado_nuevo) REFERENCES public.estado_equipo(codigo_estado);


--
-- TOC entry 3887 (class 2606 OID 16753)
-- Name: historial_estado_equipo historial_estado_equipo_codigo_motivo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estado_equipo
    ADD CONSTRAINT historial_estado_equipo_codigo_motivo_fkey FOREIGN KEY (codigo_motivo) REFERENCES public.motivo_estado_equipo(codigo_motivo);


--
-- TOC entry 3888 (class 2606 OID 16738)
-- Name: historial_estado_equipo historial_estado_equipo_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estado_equipo
    ADD CONSTRAINT historial_estado_equipo_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.equipo(id_equipo);


--
-- TOC entry 3889 (class 2606 OID 16758)
-- Name: historial_estado_equipo historial_estado_equipo_id_funcionario_ejecuta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estado_equipo
    ADD CONSTRAINT historial_estado_equipo_id_funcionario_ejecuta_fkey FOREIGN KEY (id_funcionario_ejecuta) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3890 (class 2606 OID 16772)
-- Name: historial_ubicacion_equipo historial_ubicacion_equipo_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_ubicacion_equipo
    ADD CONSTRAINT historial_ubicacion_equipo_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.equipo(id_equipo);


--
-- TOC entry 3891 (class 2606 OID 16787)
-- Name: historial_ubicacion_equipo historial_ubicacion_equipo_id_funcionario_autoriza_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_ubicacion_equipo
    ADD CONSTRAINT historial_ubicacion_equipo_id_funcionario_autoriza_fkey FOREIGN KEY (id_funcionario_autoriza) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3892 (class 2606 OID 16792)
-- Name: historial_ubicacion_equipo historial_ubicacion_equipo_id_funcionario_ejecuta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_ubicacion_equipo
    ADD CONSTRAINT historial_ubicacion_equipo_id_funcionario_ejecuta_fkey FOREIGN KEY (id_funcionario_ejecuta) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3893 (class 2606 OID 16777)
-- Name: historial_ubicacion_equipo historial_ubicacion_equipo_id_ubicacion_anterior_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_ubicacion_equipo
    ADD CONSTRAINT historial_ubicacion_equipo_id_ubicacion_anterior_fkey FOREIGN KEY (id_ubicacion_anterior) REFERENCES public.ubicacion(id_ubicacion);


--
-- TOC entry 3894 (class 2606 OID 16782)
-- Name: historial_ubicacion_equipo historial_ubicacion_equipo_id_ubicacion_nueva_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_ubicacion_equipo
    ADD CONSTRAINT historial_ubicacion_equipo_id_ubicacion_nueva_fkey FOREIGN KEY (id_ubicacion_nueva) REFERENCES public.ubicacion(id_ubicacion);


--
-- TOC entry 3907 (class 2606 OID 16896)
-- Name: log_auditoria_general log_auditoria_general_id_usuario_ejecuta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_auditoria_general
    ADD CONSTRAINT log_auditoria_general_id_usuario_ejecuta_fkey FOREIGN KEY (id_usuario_ejecuta) REFERENCES public.usuario_sistema(id_usuario);


--
-- TOC entry 3895 (class 2606 OID 16837)
-- Name: mantenimiento mantenimiento_actualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mantenimiento
    ADD CONSTRAINT mantenimiento_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3896 (class 2606 OID 16827)
-- Name: mantenimiento mantenimiento_codigo_estado_mantenimiento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mantenimiento
    ADD CONSTRAINT mantenimiento_codigo_estado_mantenimiento_fkey FOREIGN KEY (codigo_estado_mantenimiento) REFERENCES public.estado_mantenimiento(codigo_estado_mantenimiento);


--
-- TOC entry 3897 (class 2606 OID 16812)
-- Name: mantenimiento mantenimiento_codigo_tipo_mantenimiento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mantenimiento
    ADD CONSTRAINT mantenimiento_codigo_tipo_mantenimiento_fkey FOREIGN KEY (codigo_tipo_mantenimiento) REFERENCES public.tipo_mantenimiento(codigo_tipo_mantenimiento);


--
-- TOC entry 3898 (class 2606 OID 16832)
-- Name: mantenimiento mantenimiento_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mantenimiento
    ADD CONSTRAINT mantenimiento_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3899 (class 2606 OID 16807)
-- Name: mantenimiento mantenimiento_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mantenimiento
    ADD CONSTRAINT mantenimiento_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.equipo(id_equipo);


--
-- TOC entry 3900 (class 2606 OID 16822)
-- Name: mantenimiento mantenimiento_id_funcionario_recibe_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mantenimiento
    ADD CONSTRAINT mantenimiento_id_funcionario_recibe_fkey FOREIGN KEY (id_funcionario_recibe) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3901 (class 2606 OID 16817)
-- Name: mantenimiento mantenimiento_id_funcionario_solicita_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mantenimiento
    ADD CONSTRAINT mantenimiento_id_funcionario_solicita_fkey FOREIGN KEY (id_funcionario_solicita) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3906 (class 2606 OID 16882)
-- Name: reporte_generado reporte_generado_id_funcionario_genera_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporte_generado
    ADD CONSTRAINT reporte_generado_id_funcionario_genera_fkey FOREIGN KEY (id_funcionario_genera) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3860 (class 2606 OID 16540)
-- Name: ubicacion ubicacion_codigo_region_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicacion
    ADD CONSTRAINT ubicacion_codigo_region_fkey FOREIGN KEY (codigo_region) REFERENCES public.region(codigo_region);


--
-- TOC entry 3864 (class 2606 OID 16598)
-- Name: usuario_sistema usuario_sistema_actualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_sistema
    ADD CONSTRAINT usuario_sistema_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES public.funcionario(id_funcionario);


--
-- TOC entry 3865 (class 2606 OID 16593)
-- Name: usuario_sistema usuario_sistema_codigo_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_sistema
    ADD CONSTRAINT usuario_sistema_codigo_rol_fkey FOREIGN KEY (codigo_rol) REFERENCES public.rol_sistema(codigo_rol);


--
-- TOC entry 3866 (class 2606 OID 16588)
-- Name: usuario_sistema usuario_sistema_id_funcionario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_sistema
    ADD CONSTRAINT usuario_sistema_id_funcionario_fkey FOREIGN KEY (id_funcionario) REFERENCES public.funcionario(id_funcionario);


-- Completed on 2026-02-24 10:24:15 -03

--
-- PostgreSQL database dump complete
--

\unrestrict t9XAHkBzrEXmPpZXAcLmPMjW0jGyfmWfe9ISif4UamkoetZ52QJSsWBF2QlnC4m

