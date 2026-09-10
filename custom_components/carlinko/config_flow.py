"""Config flow for the CarLinko integration."""

from __future__ import annotations

import logging
import socket
from typing import Any, Mapping

import aiohttp
import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.const import CONF_PASSWORD, CONF_REGION
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import CarlinkoApi, CarlinkoAuthError, CarlinkoError
from .const import CONF_ACCOUNT, CONF_TOKEN, DEFAULT_REGION, DOMAIN, REGIONS

_LOGGER = logging.getLogger(__name__)

STEP_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_ACCOUNT): str,
        vol.Required(CONF_PASSWORD): str,
        vol.Required(CONF_REGION, default=DEFAULT_REGION): vol.In(REGIONS),
    }
)


class CarlinkoConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for CarLinko."""

    VERSION = 1

    async def _validate(self, data: dict[str, Any]) -> tuple[str | None, dict[str, str]]:
        """Try to log in with the given data. Returns (token, errors)."""
        errors: dict[str, str] = {}
        api = CarlinkoApi(
            async_get_clientsession(self.hass, family=socket.AF_INET),
            data[CONF_ACCOUNT],
            data[CONF_PASSWORD],
            region=data[CONF_REGION],
        )
        token: str | None = None
        try:
            token = await api.login()
        except CarlinkoAuthError:
            errors["base"] = "invalid_auth"
        except (CarlinkoError, aiohttp.ClientError, TimeoutError):
            errors["base"] = "cannot_connect"
        except Exception:  # noqa: BLE001
            _LOGGER.exception("Unexpected error validating CarLinko credentials")
            errors["base"] = "unknown"
        return token, errors

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}
        if user_input is not None:
            token, errors = await self._validate(user_input)
            if not errors:
                await self.async_set_unique_id(user_input[CONF_ACCOUNT].lower())
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=user_input[CONF_ACCOUNT],
                    data={**user_input, CONF_TOKEN: token},
                )

        return self.async_show_form(
            step_id="user", data_schema=STEP_SCHEMA, errors=errors
        )

    async def async_step_reauth(
        self, entry_data: Mapping[str, Any]
    ) -> ConfigFlowResult:
        """Handle reauthentication."""
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle reauth confirmation."""
        errors: dict[str, str] = {}
        reauth_entry = self._get_reauth_entry()
        if user_input is not None:
            token, errors = await self._validate(user_input)
            if not errors:
                await self.async_set_unique_id(user_input[CONF_ACCOUNT].lower())
                self._abort_if_unique_id_mismatch(reason="wrong_account")
                return self.async_update_reload_and_abort(
                    reauth_entry,
                    data_updates={**user_input, CONF_TOKEN: token},
                )

        schema = self.add_suggested_values_to_schema(
            STEP_SCHEMA,
            {
                CONF_ACCOUNT: reauth_entry.data.get(CONF_ACCOUNT),
                CONF_REGION: reauth_entry.data.get(CONF_REGION, DEFAULT_REGION),
            },
        )
        return self.async_show_form(
            step_id="reauth_confirm", data_schema=schema, errors=errors
        )
